import { Type } from "class-transformer"
import { RELATIONS_KEY } from "./constant"
import { RelationOptions, TimestampOptions } from "./interface"
import { CouchBaseModel } from "./model"

export function createRelationDecorator(type: RelationOptions["type"]) {
  return (model: () => Function, foreignKey?: string) => {
    return (target: any, propertyKey: string) => {
      const relations: RelationOptions[] =
        Reflect.getMetadata(RELATIONS_KEY, target.constructor) || []

      relations.push({
        propertyKey,
        type,
        model,
        foreignKey: foreignKey || defaultForeignKey(type, model, propertyKey),
      })

      Reflect.defineMetadata(RELATIONS_KEY, relations, target.constructor)

      Type(model)(target, propertyKey)
    }
  }
}

export function defaultForeignKey(
  type: string,
  modelFn: () => Function,
  propertyKey: string,
): string {
  const modelName = modelFn().name.toLowerCase()
  if (type === "belongsTo") return `${modelName}Id`
  if (type === "hasOne" || type === "hasMany") return `${propertyKey}Id`
  return `${modelName}Ids`
}

export function resolveTimestamps(
  input: boolean | TimestampOptions | undefined,
): TimestampOptions {
  if (input === false || input === undefined) {
    return { createdAt: false, updatedAt: false, deletedAt: false }
  }

  if (input === true) {
    return {
      createdAt: "createdAt",
      updatedAt: "updatedAt",
      deletedAt: "deletedAt",
    }
  }

  return {
    createdAt: input.createdAt ?? "createdAt",
    updatedAt: input.updatedAt ?? "updatedAt",
    deletedAt: input.deletedAt ?? "deletedAt",
  }
}

export function getTimestampFields(ts: TimestampOptions): string[] {
  const fields = []

  if (ts.createdAt !== false) fields.push(ts.createdAt as string)
  if (ts.updatedAt !== false) fields.push(ts.updatedAt as string)

  return fields
}

export class ModelRegistry {
  private static models = new Map<string, CouchBaseModel<any>>()

  static register(name: string, model: CouchBaseModel<any>) {
    this.models.set(name, model)
  }

  static get(name: string) {
    return this.models.get(name)
  }
}
