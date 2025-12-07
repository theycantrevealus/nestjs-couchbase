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
  IsEnum,
  registerDecorator,
} from "class-validator"
import "reflect-metadata"
import { PROP_METADATA_KEY, SCHEMA_KEY } from "./constant"
import { PropOptions, SchemaOptions, TimestampOptions } from "./interface"
import {
  createRelationDecorator,
  getTimestampFields,
  resolveTimestamps,
  toCollectionName,
} from "./util"
import { Type as ClassType, Transform } from "class-transformer"

export function Schema(options: SchemaOptions = {}) {
  return (target: any) => {
    const collection = options.collection || toCollectionName(target.name)
    const finalOptions: Required<SchemaOptions> & {
      timestamps: TimestampOptions
    } = {
      scope: options.scope || "_default",
      collection: collection.toLowerCase(),
      timestamps: resolveTimestamps(options.timestamps),
    }

    Reflect.defineMetadata(SCHEMA_KEY, finalOptions, target)

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
    const decorators: PropertyDecorator[] = []
    const type = Reflect.getMetadata("design:type", target, propertyKey)

    const typeFn = options.type || (() => type)

    if (options.type) {
      ClassType(options.type)(target, propertyKey)
    }

    if (options.transform) {
      Transform(({ value }) => options.transform!(value))(target, propertyKey)
    }

    if (options.default !== undefined) {
      Transform(({ obj }) => {
        if (obj[propertyKey] === undefined || obj[propertyKey] === null) {
          return typeof options.default === "function"
            ? (options.default as Function)()
            : options.default
        }
        return obj[propertyKey]
      })(target, propertyKey)
    }

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

    if (options.enum) {
      const enumValues = Array.isArray(options.enum)
        ? options.enum
        : Object.values(options.enum)

      decorators.push(
        IsEnum(options.enum, {
          message: `must be one of: ${enumValues.join(", ")}`,
          ...(options.enumName
            ? { context: { enumName: options.enumName } }
            : {}),
        }),
      )
    }

    if (options.validate) {
      registerDecorator({
        name: "customPropValidator",
        target: target.constructor,
        propertyName: propertyKey,
        options: {
          message: options.validateMessage || `${propertyKey} is invalid`,
        },
        validator: {
          validate(value: any) {
            return options.validate!(value)
          },
        },
      })
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
