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
  type?: () => Function
  each?: boolean
  ref?: string
  // TODO : Adjust the field definition property here
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

export interface RelationOptions {
  propertyKey: string
  type: RelationType
  model: () => Function
  foreignKey?: string
}
