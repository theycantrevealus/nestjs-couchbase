import { DynamicModule, Global, Module, Provider, Type } from "@nestjs/common"
import * as couchbase from "couchbase"
import {
  ICouchBaseAsyncOptions,
  ICouchBaseOptions,
  ICouchBaseOptionsFactory,
} from "./interface"
import { CouchBaseService, IndexBootstrapService } from "./service"
import { getModelToken } from "./decorator"
import {
  COUCHBASE_BUCKET,
  COUCHBASE_CLUSTER,
  COUCHBASE_OPTIONS,
  SCHEMA_KEY_OPT,
} from "./constant"
import { CouchBaseModel } from "./model"
import { getSchemaOptions, ModelRegistry } from "./util"
import { DiscoveryService } from "@nestjs/core"

@Global()
@Module({})
export class CouchBaseModule {
  static forRoot(options: ICouchBaseOptions): DynamicModule {
    const providers: Provider[] = [
      DiscoveryService,
      IndexBootstrapService,
      { provide: COUCHBASE_OPTIONS, useValue: options },
      {
        provide: COUCHBASE_CLUSTER,
        useFactory: async (opts: ICouchBaseOptions) => {
          return await couchbase.connect(opts.connectionString, {
            username: opts.username,
            password: opts.password,
          })
        },
        inject: [COUCHBASE_OPTIONS],
      },
      {
        provide: COUCHBASE_BUCKET,
        useFactory: (cluster: couchbase.Cluster, opts: ICouchBaseOptions) => {
          return cluster.bucket(opts.bucketName)
        },
        inject: [COUCHBASE_CLUSTER, COUCHBASE_OPTIONS],
      },
      CouchBaseService,
    ]

    return {
      module: CouchBaseModule,
      providers,
      exports: [
        COUCHBASE_CLUSTER,
        COUCHBASE_BUCKET,
        CouchBaseService,
        DiscoveryService,
      ],
    }
  }

  /**
   * @static
   */
  static forRootAsync(options: ICouchBaseAsyncOptions): DynamicModule {
    const asyncProviders = this.createAsyncProviders(options)

    const providers: Provider[] = [
      ...asyncProviders,
      DiscoveryService,
      IndexBootstrapService,
      {
        provide: COUCHBASE_CLUSTER,
        useFactory: async (opts: ICouchBaseOptions) => {
          return await couchbase.connect(opts.connectionString, {
            username: opts.username,
            password: opts.password,
          })
        },
        inject: [COUCHBASE_OPTIONS],
      },
      {
        provide: COUCHBASE_BUCKET,
        useFactory: (cluster: couchbase.Cluster, opts: ICouchBaseOptions) => {
          return cluster.bucket(opts.bucketName)
        },
        inject: [COUCHBASE_CLUSTER, COUCHBASE_OPTIONS],
      },

      CouchBaseService,
    ]

    return {
      module: CouchBaseModule,
      global: true,
      imports: options.imports || [],
      providers,
      exports: [
        COUCHBASE_CLUSTER,
        COUCHBASE_BUCKET,
        CouchBaseService,
        DiscoveryService,
      ],
    }
  }

  private static createAsyncProviders(
    options: ICouchBaseAsyncOptions,
  ): Provider[] {
    if (options.useExisting || options.useFactory) {
      return [this.createAsyncOptionsProvider(options)]
    }
    if (options.useClass) {
      return [
        this.createAsyncOptionsProvider(options),
        { provide: options.useClass, useClass: options.useClass },
      ]
    }
    throw new Error("Invalid async options")
  }

  private static createAsyncOptionsProvider(
    options: ICouchBaseAsyncOptions,
  ): Provider {
    if (options.useFactory) {
      return {
        provide: COUCHBASE_OPTIONS,
        useFactory: options.useFactory,
        inject: options.inject || [],
      }
    }
    const inject = [
      (options.useClass ||
        options.useExisting) as Type<ICouchBaseOptionsFactory>,
    ]
    return {
      provide: COUCHBASE_OPTIONS,
      useFactory: async (optionsFactory: ICouchBaseOptionsFactory) =>
        await optionsFactory.createCouchbaseOptions(),
      inject,
    }
  }

  static forFeature(schemaClasses: Type<any>[]): DynamicModule {
    const providers = schemaClasses.map((schemaClass) => ({
      provide: getModelToken(schemaClass.name),
      useFactory: (service: CouchBaseService) => {
        const options =
          getSchemaOptions(schemaClass) ||
          Reflect.getMetadata(SCHEMA_KEY_OPT, schemaClass) ||
          {}
        const scope = options.scope || "_default"
        const collectionName =
          options.collection || schemaClass.name.toLowerCase()
        const bucket = service.getBucket()
        const collection = bucket.scope(scope).collection(collectionName)
        const model = new CouchBaseModel(
          collection,
          schemaClass,
          service.getCluster(),
          collectionName,
          bucket,
          scope,
          options,
        )
        ModelRegistry.register(schemaClass.name, model)
        return model
      },
      inject: [CouchBaseService],
    }))

    return {
      module: CouchBaseModule,
      providers,
      exports: providers.map((p) => p.provide),
    }
  }
}
