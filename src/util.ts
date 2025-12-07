import { Type } from "class-transformer"
import { PROP_UNIQUE_INDEXES_KEY, RELATIONS_KEY, SCHEMA_KEY } from "./constant"
import {
  RelationOptions,
  SchemaOptions,
  TimestampOptions,
  UniqueIndexMetadata,
} from "./interface"
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

export function addUniqueIndex(metadata: UniqueIndexMetadata) {
  const existing: UniqueIndexMetadata[] =
    Reflect.getMetadata(PROP_UNIQUE_INDEXES_KEY, global) || []

  const duplicate = existing.some(
    (e) =>
      e.collection === metadata.collection &&
      e.indexName === metadata.indexName &&
      e.fields.join(",") === metadata.fields.join(","),
  )

  if (!duplicate) {
    existing.push(metadata)
    Reflect.defineMetadata(PROP_UNIQUE_INDEXES_KEY, existing, global)
  }
}

export function Unique(fields: string[], options?: { name?: string }) {
  return (target: any) => {
    const schemaOpts = Reflect.getMetadata(SCHEMA_KEY, target) as SchemaOptions
    if (!schemaOpts?.collection) throw new Error("Missing @Schema()")

    const indexName =
      options?.name || `idx_${schemaOpts.collection}_${fields.join("_")}_unique`

    addUniqueIndex({
      collection: schemaOpts.collection,
      fields,
      indexName,
      caseSensitive: true,
    })
  }
}

export function getAllUniqueIndexes(): UniqueIndexMetadata[] {
  return Reflect.getMetadata(PROP_UNIQUE_INDEXES_KEY, global) || []
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
