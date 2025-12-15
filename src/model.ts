import { BadRequestException } from "@nestjs/common"
import {
  Collection,
  Cluster,
  TransactionAttemptContext,
  GetResult,
  QueryResult,
  TransactionGetResult,
  CollectionManager,
  Bucket,
} from "couchbase"
import {
  plainToInstance,
  ClassConstructor,
  instanceToPlain,
} from "class-transformer"
import { validate } from "class-validator"
import {
  QueryOptionsExt,
  RelationOptions,
  SchemaOptions,
  TimestampOptions,
} from "./interface"
import { PROP_DEFAULT_KEY, RELATIONS_KEY, SCHEMA_KEY_OPT } from "./constant"
import { randomUUID } from "crypto"
import { getKeyField, getSchemaOptions, ModelRegistry } from "./util"

export class CouchBaseModel<T extends object> {
  private readonly bucketName: string
  private readonly scopeName: string
  private readonly collectionName: string

  constructor(
    private readonly collection: Collection,
    private readonly schemaClass: ClassConstructor<T>,
    private readonly cluster: Cluster,
    collectionName: string,
    private readonly bucket: Bucket,
    scopeName: string,
    private readonly options: any,
  ) {
    this.bucketName = bucket.name
    this.scopeName = scopeName
    this.collectionName = collectionName.toLowerCase()
    this.createCollectionsIfNotExist()
  }

  get configuration(): any {
    return this.options
  }

  get targetSchemaClass(): ClassConstructor<T> {
    return this.schemaClass
  }

  private async createCollectionsIfNotExist() {
    const manager = this.bucket.collections()
    await this.ensureScopeAndCollection(
      manager,
      this.scopeName,
      this.collectionName.toLowerCase(),
    )
  }

  private async ensureScopeAndCollection(
    manager: CollectionManager,
    scope: string,
    collection: string,
  ) {
    if (scope !== "_default") {
      try {
        await Promise.race([
          manager.createScope(scope),
          new Promise((_, r) =>
            setTimeout(() => r(new Error("timeout")), 10000),
          ),
        ])
      } catch (err: any) {
        if (
          !err.message.includes("already exists") &&
          !err.message.includes("timeout")
        ) {
          console.warn("Scope issue:", err)
        }
      }
    }

    try {
      await Promise.race([
        manager.createCollection(collection, scope),
        new Promise((_, r) => setTimeout(() => r(new Error("timeout")), 10000)),
      ])
    } catch (err: any) {
      if (err.message.includes("timeout")) {
        console.warn(
          `createCollection() timed out for ${scope}.${collection} — likely hanging on Management API`,
        )
      } else if (!err.message.includes("collection exists")) {
        console.warn("Collection creation failed:", err)
      }
    }
  }

  private async generateId(): Promise<string> {
    return randomUUID()
  }

  private getSchemaOptions(): Required<SchemaOptions> & {
    timestamps: TimestampOptions
  } {
    return (
      getSchemaOptions(this.schemaClass) ||
      Reflect.getMetadata(SCHEMA_KEY_OPT, this.schemaClass) || {
        scope: "_default",
        collection: this.schemaClass.name.toLowerCase(),
        timestamps: {
          createdAt: "createdAt",
          updatedAt: "updatedAt",
          deletedAt: "deletedAt",
        },
      }
    )
  }

  private deepMerge(
    target: any,
    source: any,
  ) {
    for (const key of Object.keys(source)) {
      const value = source[key]

      if (
        typeof value === "object" &&
        value !== null &&
        !Array.isArray(value)
      ) {
        if (!target[key]) target[key] = {}
        this.deepMerge(target[key], value)
      } else if (Array.isArray(value)) {
        target[key] = [...value]
      } else {
        target[key] = value
      }
    }

    return target
  }

  private applyDefaults<T extends object>(
    data: Partial<T>,
    schemaClass: new () => T
  ): Partial<T> {
    const defaults = Reflect.getMetadata(PROP_DEFAULT_KEY, schemaClass) || {};
    const clone: any = { ...data };

    for (const [property, defaultValue] of Object.entries(defaults)) {
      const current = clone[property];

      if (current !== undefined && current !== null) continue;

      if (typeof defaultValue === "function") {
        clone[property] = defaultValue();
        continue;
      }

      if (
        typeof defaultValue === "object" &&
        defaultValue !== null &&
        !Array.isArray(defaultValue)
      ) {
        clone[property] = this.deepMerge({}, defaultValue);
        continue;
      }

      if (Array.isArray(defaultValue)) {
        clone[property] = [...defaultValue];
        continue;
      }

      clone[property] = defaultValue;
    }

    return clone
  }

  async create(
    data: Partial<T>,
    tx?: TransactionAttemptContext,
  ): Promise<T & { id: string }> {
    const withDefaults = this.applyDefaults<T>(data, this.schemaClass);
    const instance = plainToInstance(this.schemaClass, withDefaults)
    const errors = await validate(instance as any)
    const errorList = []
    if (errors.length > 0) {
      errors.map((e) => {
        errorList.push([
          ...e.children.map((e) => Object.values(e.constraints || {})).flat(),
        ])
      })
    }

    if (errorList.length > 0) throw new Error(errorList.join(","))

    const opts = this.getSchemaOptions()
    const ts = opts.timestamps
    const now = new Date()

    if (ts.createdAt !== false) (instance as any)[ts.createdAt] = now
    if (ts.updatedAt !== false) (instance as any)[ts.updatedAt] = now
    if (ts.deletedAt !== false) (instance as any)[ts.deletedAt] = null

    let id: string
    const keyField = getKeyField(this.schemaClass)
    if (keyField) {
      const value = (instance as any)[keyField.propertyKey]
      if (!value) {
        throw new Error(`Key field ${keyField.propertyKey} is required`)
      }
      const prefix = keyField.options?.prefix || ""
      const separator = keyField.options?.separator || "::"
      id = `${prefix}${value}`
    } else {
      id = await this.generateId()
    }
    const content = instanceToPlain(instance, { exposeDefaultValues: true })

    if (tx) await tx.insert(this.collection, id, content)
    else await this.collection.insert(id, content)

    return { ...instance, id } as T & { id: string }
  }

  async get(
    id: string,
    tx?: TransactionAttemptContext,
  ): Promise<T & { id: string }> {
    return this.findById(id, tx)
  }

  async findById(
    id: string,
    tx?: TransactionAttemptContext,
  ): Promise<T & { id: string }> {
    let result: GetResult | TransactionGetResult

    if (tx) {
      result = await tx.get(this.collection, id)
    } else {
      result = await this.collection.get(id)
    }

    return this.hydrate(result.content, id)
  }

  async update(
    id: string,
    data: Partial<T>,
    tx?: TransactionAttemptContext,
  ): Promise<T & { id: string }> {
    const current = await this.findById(id, tx)
    const updatedPlain = { ...instanceToPlain(current), ...data }
    const instance = plainToInstance(this.schemaClass, updatedPlain)

    const errors = await validate(instance as any)
    if (errors.length > 0) {
      throw new BadRequestException(
        errors.map((e) => Object.values(e.constraints || {})).flat(),
      )
    }

    const opts = this.getSchemaOptions()
    const ts = opts.timestamps

    if (ts.updatedAt !== false) (instance as any)[ts.updatedAt] = new Date()
    if (ts.createdAt !== false)
      (instance as any)[ts.createdAt] = (current as any)[ts.createdAt]

    const content = instanceToPlain(instance)
    let doc: TransactionGetResult
    if (tx) doc = await tx.get(this.collection, id)

    if (tx) await tx.replace(doc, id, content)
    else await this.collection.replace(id, content)

    return { ...instance, id } as T & { id: string }
  }

  async remove(id: string, tx?: TransactionAttemptContext): Promise<void> {
    if (tx) {
      const doc: TransactionGetResult = await tx.get(this.collection, id)
      await tx.remove(doc)
    } else {
      await this.collection.remove(id)
    }
  }

  async removeSoft(id: string, tx?: TransactionAttemptContext): Promise<void> {
    const opts = this.getSchemaOptions()
    const ts = opts.timestamps
    if (ts.deletedAt === false) {
      throw new Error("deletedAt field is disabled")
    }

    if (ts.deletedAt)
      if (tx) await this.update(id, { [ts.deletedAt]: new Date() } as any, tx)
      else
        // await this.collection.replace(id, { [ts.deletedAt]: new Date() } as any)
        await this.update(id, { [ts.deletedAt]: new Date() } as any)
  }

  private buildBaseQuery(where: Record<string, any> = {}): {
    statement: string
    params: Record<string, any>
  } {
    let statement = `SELECT META().id as id, ${this.collectionName}.* FROM \`${this.bucketName}\`.\`${this.scopeName}\`.\`${this.collectionName}\``
    const params: Record<string, any> = {}
    const conditions: string[] = []

    Object.entries(where).forEach(([key, value], idx) => {
      const paramName = `$p${idx}`
      if (value && typeof value === "object" && !(value instanceof Date)) {
        if ("$in" in value) {
          conditions.push(`${key} IN ${paramName}`)
          params[paramName] = value.$in
        } else if ("$gt" in value) {
          conditions.push(`${key} > ${paramName}`)
          params[paramName] = value.$gt
        } else if ("$lt" in value) {
          conditions.push(`${key} < ${paramName}`)
          params[paramName] = value.$lt
        } else if ("$ne" in value) {
          conditions.push(`${key} != ${paramName}`)
          params[paramName] = value.$ne
        }
      } else {
        conditions.push(`${key} = ${paramName}`)
        params[paramName] = value
      }
    })

    if (conditions.length > 0) {
      statement += ` WHERE ${conditions.join(" AND ")}`
    }

    for (const [key, value] of Object.entries(params)) {
      if (value === null) {
        const regex = new RegExp(`=\\s*\\${key}\\b`, "g")
        statement = statement.replace(regex, "IS NULL")

        delete params[key]
      }
    }

    return {
      statement,
      params,
    }
  }

  async find(
    filter: Record<string, any> = {},
    options: {
      limit?: number
      skip?: number
      sort?: Record<string, 1 | -1>
    } = {},
    includeSoft: boolean = false,
  ): Promise<(T & { id: string })[]> {
    const opts = this.getSchemaOptions()
    if (!includeSoft)
      if (opts.timestamps.deletedAt !== false) {
        filter = { ...filter, [opts.timestamps.deletedAt]: null }
      }

    let { statement, params } = this.buildBaseQuery(filter)

    if (options.sort) {
      const sortParts = Object.entries(options.sort).map(
        ([field, direction]) => `${field} ${direction === 1 ? "ASC" : "DESC"}`,
      )
      statement += ` ORDER BY ${sortParts.join(", ")}`
    }

    if (options.limit) statement += ` LIMIT $limit`
    if (options.skip) statement += ` OFFSET $skip`

    const queryOptions = {
      parameters: { ...params },
    }
    if (options.limit) queryOptions.parameters!.$limit = options.limit
    if (options.skip) queryOptions.parameters!.$skip = options.skip

    const result = await this.cluster.query(statement, queryOptions)

    return result.rows.map((row) =>
      // this.hydrate(row[this.collectionName], row.id),
      this.hydrate(row, row.id),
    )
  }

  async findOne(
    filter: Record<string, any>,
  ): Promise<(T & { id: string }) | null> {
    const results = await this.find(filter, { limit: 1 })
    return results[0] || null
  }

  async findByIdAndUpdate(
    id: string,
    update: Partial<T>,
  ): Promise<T & { id: string }> {
    await this.update(id, update)
    return this.findById(id)
  }

  async count(filter: Record<string, any> = {}): Promise<number> {
    let { statement, params } = this.buildBaseQuery(filter)
    statement = statement.replace(
      `SELECT META().id as id, ${this.collectionName}.*`,
      "SELECT COUNT(*) as count",
    )

    const result = await this.cluster.query(statement, {
      parameters: params,
    })

    return result.rows[0].count
  }

  async deleteMany(
    filter: Record<string, any>,
  ): Promise<{ deletedCount: number }> {
    const docs = await this.find(filter)
    const ids = docs.map((d) => d.id)

    if (ids.length === 0) return { deletedCount: 0 }

    await this.cluster.transactions().run(async (tx) => {
      for (const id of ids) {
        const doc: TransactionGetResult = await tx.get(this.collection, id)
        await tx.remove(doc)
      }
    })

    return { deletedCount: ids.length }
  }

  private getRelations(instance: any): RelationOptions[] {
    return Reflect.getMetadata(RELATIONS_KEY, instance.constructor) || []
  }

  async populate(
    docs: (T & { id: string }) | (T & { id: string })[],
    path?: string | string[],
  ): Promise<any> {
    const items = Array.isArray(docs) ? docs : [docs]
    if (items.length === 0) return docs

    const relations = this.getRelations(items[0])

    const paths = path
      ? Array.isArray(path)
        ? path
        : [path]
      : relations.map((r) => r.propertyKey)

    for (const relation of relations) {
      if (!paths.includes(relation.propertyKey)) continue

      const RelatedModelClass = relation.model()
      const relatedModel = ModelRegistry.get(RelatedModelClass.name)
      if (!relatedModel) continue

      if (relation.type === "belongsTo") {
        const fk = relation.foreignKey!
        const ids = [
          ...new Set(items.map((item) => (item as any)[fk]).filter(Boolean)),
        ]

        if (ids.length === 0) {
          items.forEach((item) => ((item as any)[relation.propertyKey] = null))
          continue
        }

        const parents = await relatedModel.find({ id: { $in: ids } })
        const parentMap = new Map(parents.map((p) => [p.id, p]))

        items.forEach((item) => {
          const parentId = (item as any)[fk]
          ;(item as any)[relation.propertyKey] = parentMap.get(parentId) || null
        })
      } else if (relation.type === "hasOne" || relation.type === "hasMany") {
        const fk = relation.foreignKey!
        const parentIds = items.map((item) => item.id)

        const children = await relatedModel.find({ [fk]: { $in: parentIds } })
        const childrenByParentId = new Map<string, any[]>()

        children.forEach((child) => {
          const key = child[fk]
          if (!childrenByParentId.has(key)) childrenByParentId.set(key, [])
          childrenByParentId.get(key)!.push(child)
        })

        items.forEach((item) => {
          const list = childrenByParentId.get(item.id) || []
          ;(item as any)[relation.propertyKey] =
            relation.type === "hasOne" ? list[0] || null : list
        })
      }
    }

    return Array.isArray(docs) ? items : items[0]
  }

  async query<T = any>(
    statement: string,
    options?: QueryOptionsExt,
  ): Promise<QueryResult<T>> {
    return this.cluster.query(statement, options)
  }

  private hydrate(content: any, id: string): T & { id: string } {
    const instance = plainToInstance(this.schemaClass, content);

    (instance as any).id = id;
    (instance as any).created_at = content.created_at;
    (instance as any).updated_at = content.updated_at;
    (instance as any).deleted_at = content.deleted_at;

    return instance as T & { id: string };
  }
}
