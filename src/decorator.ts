import { applyDecorators, Inject } from "@nestjs/common"
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
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from "class-validator"
import "reflect-metadata"
import {
  PROP_DEFAULT_KEY,
  PROP_METADATA_KEY,
  SCHEMA_KEY,
  SCHEMA_REGISTRY,
} from "./constant"
import { PropOptions, SchemaOptions, TimestampOptions } from "./interface"
import {
  createRelationDecorator,
  getTimestampFields,
  resolveTimestamps,
  toCollectionName,
} from "./util"
import { Type as ClassType, Transform } from "class-transformer"

@ValidatorConstraint({ name: "customPropValidator", async: false })
export class CustomPropValidator implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    const validateFn = args.constraints[0] as (v: any) => boolean
    return validateFn(value)
  }

  defaultMessage(args: ValidationArguments) {
    const message = args.constraints[1] as string | undefined
    return message || `${args.property} failed validation`
  }
}

/**
 * @function
 * Schema decorator that mimic mongoose-type
 *
 * @param { SchemaOptions} options - Schema configuration
 * @returns
 */
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

    /**Traditional: It's not using Symbol notation that could confuse mapping name */
    // Reflect.defineMetadata(SCHEMA_KEY_OPT, finalOptions, target)

    ;(target as any)[SCHEMA_KEY] = finalOptions
    target.prototype[SCHEMA_KEY] = finalOptions
    SCHEMA_REGISTRY.set(target, finalOptions)
    target.prototype.__schema__ = finalOptions

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
 * Prop decorator that mimic mongoose-type
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
      const defaults =
        Reflect.getMetadata(PROP_DEFAULT_KEY, target.constructor) || {}
      defaults[propertyKey] = options.default
      Reflect.defineMetadata(PROP_DEFAULT_KEY, defaults, target.constructor)
    }

    if (type === Array) {
      decorators.push(IsArray())
      if (options.each !== false) {
        decorators.push(ValidateNested({ each: true }))
      }

      if (options.type) {
        ClassType(typeFn)(target, propertyKey)
      }
    } else if (type === Object) {
      decorators.push(IsObject())
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
      ValidatorConstraint({ name: "customPropValidator" })(CustomPropValidator)
      registerDecorator({
        target: target.constructor,
        propertyName: propertyKey,
        options: { message: options.validateMessage },
        validator: CustomPropValidator,
        constraints: [options.validate, options.validateMessage],
      })
    }

    if (options.required) {
      decorators.push(IsDefined({ message: `${propertyKey} is required` }))
    } else {
      decorators.push(IsOptional())
    }

    const props: any[] =
      Reflect.getMetadata(PROP_METADATA_KEY, target.constructor) || []

    if (props.filter((a) => a.property !== propertyKey)) {
      props.push({
        property: propertyKey,
        options: options,
      })

      Reflect.defineMetadata(PROP_METADATA_KEY, props, target.constructor)
    }

    return applyDecorators(...decorators)(target, propertyKey)
  }
}

/**
 * @function
 * Get registered token model
 *
 * @param { string} modelName - Model name to get
 * @returns { string }
 */
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
