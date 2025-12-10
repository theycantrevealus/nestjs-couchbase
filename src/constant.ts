export const COUCHBASE_OPTIONS = "COUCHBASE_OPTIONS"
export const COUCHBASE_CLUSTER = "COUCHBASE_CLUSTER"
export const COUCHBASE_BUCKET = "COUCHBASE_BUCKET"
export const SCHEMA_KEY = Symbol("couchbase:schema")
export const SCHEMA_KEY_OPT = Symbol("couchbase:schema_meta_opt")
export const KEY_METADATA = Symbol("couchbase:key")
export const SCHEMA_REGISTRY = new Map<Function, any>()
export const PROP_METADATA_KEY = "couchbase:props"
export const PROP_UNIQUE_INDEXES_KEY = "couchbase:unique_indexes"
export const RELATIONS_KEY = "couchbase:relations"
export const PENDING_UNIQUE_INDEXES: Array<{
  target: Function
  fields: string[]

  options?: { name?: string; scope?: string }
}> = []
