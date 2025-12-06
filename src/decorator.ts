// decorators.ts
import { applyDecorators, Inject, Type } from "@nestjs/common"
import {
  IsDefined,
  IsString,
  IsNumber,
  IsBoolean,
  IsDate,
  IsArray,
  IsObject,
  ValidateNested,
  IsOptional,
} from "class-validator"
import "reflect-metadata"
import { PROP_METADATA_KEY, SCHEMA_KEY } from "./constant"
import { PropOptions, SchemaOptions, TimestampOptions } from "./interface"
import {
  createRelationDecorator,
  getTimestampFields,
  resolveTimestamps,
} from "./util"
import { Type as ClassType } from "class-transformer"

export function Schema(options: SchemaOptions = {}) {
  return (target: any) => {
    const finalOptions: Required<SchemaOptions> & {
      timestamps: TimestampOptions
    } = {
      scope: options.scope || "_default",
      collection: options.collection || target.name.toLowerCase(),
      timestamps: resolveTimestamps(options.timestamps),
    }

    Reflect.defineMetadata(SCHEMA_KEY, finalOptions, target)

    // Auto-inject timestamp fields into prototype
    const fields = getTimestampFields(finalOptions.timestamps)
    fields.forEach((field) => {
      if (!Object.prototype.hasOwnProperty.call(target.prototype, field)) {
        Object.defineProperty(target.prototype, field, {
          value: undefined,
          writable: true,
          enumerable: true,
          configurable: true,
        })
      }
    })
  }
}

/**
 * @function
 * Prop function that mimic mongoose-type
 *
 * @param { PropOptions} options - Property option for data type
 * @returns
 */
export function Prop(options: PropOptions = {}) {
  return (target: any, propertyKey: string) => {
    const decorators: any[] = []
    const type = Reflect.getMetadata("design:type", target, propertyKey)

    const typeFn = options.type || (() => type)

    if (type === Object || type === Array) {
      ClassType(typeFn)(target, propertyKey)
      if (type === Array) {
        decorators.push(IsArray())
        if (options.each !== false) {
          decorators.push(ValidateNested({ each: true }))
        }
      } else {
        decorators.push(IsObject())
        decorators.push(ValidateNested())
      }
    } else {
      if (type === String) decorators.push(IsString())
      else if (type === Number) decorators.push(IsNumber())
      else if (type === Boolean) decorators.push(IsBoolean())
      else if (type === Date) decorators.push(IsDate())
      else if (type === Array) decorators.push(IsArray())
    }

    if (options.required) {
      decorators.push(IsDefined({ message: `${propertyKey} is required` }))
    } else {
      decorators.push(IsOptional())
    }

    const props: string[] =
      Reflect.getMetadata(PROP_METADATA_KEY, target.constructor) || []
    if (!props.includes(propertyKey)) {
      props.push(propertyKey)
      Reflect.defineMetadata(PROP_METADATA_KEY, props, target.constructor)
    }

    return applyDecorators(...decorators)(target, propertyKey)
  }
}

export function getModelToken(modelName: string): string {
  return `${modelName}Model`
}

export const InjectModel = (modelName: string) =>
  Inject(getModelToken(modelName))

export const BelongsTo = (model: () => Function, foreignKey?: string) =>
  createRelationDecorator("belongsTo")(model, foreignKey)

export const HasOne = (model: () => Function, foreignKey?: string) =>
  createRelationDecorator("hasOne")(model, foreignKey)

export const HasMany = (model: () => Function, foreignKey?: string) =>
  createRelationDecorator("hasMany")(model, foreignKey)

export const ManyToMany = (model: () => Function) =>
  createRelationDecorator("manyToMany")(model)
