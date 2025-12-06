import { ModuleMetadata, Type } from "@nestjs/common"
import { QueryOptions } from "couchbase"
import { RelationType } from "./type"

export interface ICouchBaseOptions {
  connectionString: string
  username: string
  password: string
  bucketName: string
}

export interface ICouchBaseOptionsFactory {
  createCouchbaseOptions(): Promise<ICouchBaseOptions> | ICouchBaseOptions
}

export interface ICouchBaseAsyncOptions extends Pick<
  ModuleMetadata,
  "imports"
> {
  useExisting?: Type<ICouchBaseOptionsFactory>
  useClass?: Type<ICouchBaseOptionsFactory>
  useFactory?: (
    ...args: any[]
  ) => Promise<ICouchBaseOptions> | ICouchBaseOptions
  inject?: any[]
}

export interface QueryOptionsExt extends QueryOptions {
  parameters?: any[]
  namedParameters?: Record<string, any>
}

export interface PropOptions {
  required?: boolean
  each?: boolean
  ref?: string
  default?: any | (() => any)
  enum?: any[] | Record<string, any>
  enumName?: string
  type?: () => Function
  validate?: (value: any) => boolean
  validateMessage?: string
  transform?: (value: any) => any
}

export interface TimestampOptions {
  createdAt?: string | false
  updatedAt?: string | false
  deletedAt?: string | false
}

/**
 * @interface
 * Custom interface for mongoose-like schema definition
 *
 * @param { string } scope - The scope name of schema
 * @param { string } collection - The collection name of schema
 * @param { boolean | Record<string, any> } timestamps - Set to true automatically create timestamp columns for schema (createdAt, updatedAt, deletedAt). You also create defined name for this
 */
export interface SchemaOptions {
  scope?: string
  collection?: string
  timestamps?: boolean | TimestampOptions
}

/**
 * @interface
 * Inspired by typeorm typing
 *
 * @param { string } propertyKey - Key of relation
 * @param { RelationType } type - The type of relation
 * @param { Function } model - Target relational model
 * @param { string } foreignKey - Foreign collection field
 */
export interface RelationOptions {
  propertyKey: string
  type: RelationType
  model: () => Function
  foreignKey?: string
}
