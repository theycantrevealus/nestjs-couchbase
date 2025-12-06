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
} from "class-validator"
import "reflect-metadata"
import { SCHEMA_KEY } from "./constant"
import { PropOptions, SchemaOptions, TimestampOptions } from "./interface"
import {
  createRelationDecorator,
  getTimestampFields,
  resolveTimestamps,
} from "./util"

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

export function Prop(options: PropOptions = {}) {
  return (target: any, propertyKey: string) => {
    const decorators: any[] = []
    const type = Reflect.getMetadata("design:type", target, propertyKey)

    if (type === String) {
      decorators.push(IsString())
    } else if (type === Number) {
      decorators.push(IsNumber())
    } else if (type === Boolean) {
      decorators.push(IsBoolean())
    } else if (type === Date) {
      decorators.push(IsDate())
    } else if (type === Array) {
      decorators.push(IsArray())
    } else if (type === Object) {
      decorators.push(IsObject())
      decorators.push(ValidateNested())
    }

    if (options.required) {
      decorators.push(IsDefined({ message: `${propertyKey} is required` }))
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
