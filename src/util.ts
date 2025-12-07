import { Type } from "class-transformer"
import {
  PENDING_UNIQUE_INDEXES,
  PROP_UNIQUE_INDEXES_KEY,
  RELATIONS_KEY,
  SCHEMA_KEY,
  SCHEMA_REGISTRY,
} from "./constant"
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

export function toCollectionName(className: string): string {
  return className.charAt(0).toLowerCase() + className.slice(1)
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

export function getNestedPath(
  currentProto: any,
  leafProperty: string,
  rootClassName: string,
): string {
  const pathParts: string[] = [leafProperty]
  let proto = Object.getPrototypeOf(currentProto)

  while (proto && proto !== Object.prototype) {
    if (proto.constructor.name === rootClassName) break

    const embeddedMap = Reflect.getMetadata(
      "couchbase:embedded",
      proto.constructor,
    )
    if (embeddedMap) {
      for (const [prop, typeFn] of Object.entries(embeddedMap)) {
        if ((typeFn as any).name === currentProto.constructor.name) {
          pathParts.unshift(prop)
          proto = Object.getPrototypeOf(proto)
          break
        }
      }
    } else {
      proto = Object.getPrototypeOf(proto)
    }
  }

  return pathParts.join(".")
}

// export function Unique(fields: string | string[], options?: { name?: string }) {
//   return (target: any) => {
//     const schemaOpts = getSchemaOptions(target)
//     const collection = schemaOpts.collection

//     const fieldList = Array.isArray(fields) ? fields : [fields]
//     const indexName =
//       options?.name || `idx_${collection}_${fieldList.join("_")}_unique`

//     addUniqueIndex({
//       collection,
//       fields: fieldList,
//       indexName,
//       caseSensitive: true,
//     })
//   }
// }

export function Unique(
  fields: string | string[],
  options?: { name?: string; scope?: string },
) {
  return (target: Function) => {
    PENDING_UNIQUE_INDEXES.push({
      target,
      fields: Array.isArray(fields) ? fields : [fields],
      options,
    })
  }
}

export async function createAllUniqueIndexes() {
  for (const item of PENDING_UNIQUE_INDEXES) {
    const schemaOpts = getSchemaOptions(item.target)
    if (!schemaOpts?.collection) {
      console.warn(`@Unique() skipped: no @Schema() on ${item.target.name}`)
      continue
    }

    const collection = schemaOpts.collection
    const indexName =
      item.options?.name || `idx_${collection}_${item.fields.join("_")}_unique`

    addUniqueIndex({
      collection,
      scope: item.options?.scope || "_default",
      fields: item.fields,
      indexName,
      caseSensitive: true,
    })
  }

  PENDING_UNIQUE_INDEXES.length = 0
}

export function getSchemaOptions(klass: Function): any {
  if ((klass as any)[SCHEMA_KEY]) {
    return (klass as any)[SCHEMA_KEY]
  }

  if (klass.prototype && (klass.prototype as any)[SCHEMA_KEY]) {
    return (klass.prototype as any)[SCHEMA_KEY]
  }

  if (SCHEMA_REGISTRY.has(klass)) {
    return SCHEMA_REGISTRY.get(klass)
  }

  if (klass.prototype && (klass.prototype as any).__schema__) {
    return (klass.prototype as any).__schema__
  }

  return null
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
