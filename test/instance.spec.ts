import { Test, TestingModule } from "@nestjs/testing"
import { Bucket, Cluster } from "couchbase"
import { Breed, BreedNoKey } from "./model/breed"
import { CouchBaseModel, CouchBaseModule, getModelToken } from "../src"
import { CouchBaseService } from "../src/service"
import { Owner } from "./model/owner"

var resetStore: () => void

jest.mock("couchbase", () => {
  const store = new Map<string, any>()
  resetStore = () => {
    store.clear()
  }

  const mockManager = {
    getAllScopes: jest.fn().mockResolvedValue([]),
    createScope: jest.fn().mockResolvedValue(undefined),
    createCollection: jest.fn().mockResolvedValue(undefined),
  }

  const mockBucket = {
    name: "test_bucket",
    collections: jest.fn(() => mockManager),
    defaultCollection: jest.fn(),
    scope: jest.fn(),
  }

  const mockScope = {
    name: "_default",
    bucket: jest.fn(() => mockBucket),
    collection: jest.fn(),
    collections: [],
  }

  const mockCollection = {
    insert: jest.fn(async (key, value) => {
      if (store.has(key)) throw new Error("DocumentExists")
      store.set(key, value)
      return { cas: BigInt(1) }
    }),
    get: jest.fn(async (key) => {
      if (!store.has(key)) throw new Error("DocumentNotFound")
      return { content: store.get(key), cas: BigInt(1) }
    }),
    upsert: jest.fn(async (key, value) => {
      store.set(key, value)
      return { cas: BigInt(1) }
    }),
    replace: jest.fn(async (key, value) => {
      if (!store.has(key)) throw new Error("DocumentNotFound")
      store.set(key, value)
      return { cas: BigInt(1) }
    }),
    remove: jest.fn(async (key) => {
      store.delete(key)
      return { cas: BigInt(1) }
    }),
    scope: mockScope,
  }

  // wire up relationships
  mockManager.getAllScopes.mockResolvedValue([mockScope])
  mockBucket.defaultCollection.mockReturnValue(mockCollection)
  mockBucket.scope.mockReturnValue(mockScope)
  mockScope.collection.mockReturnValue(mockCollection)

  const mockCluster = {
    bucket: jest.fn().mockReturnValue(mockBucket),
    query: jest.fn(async () => ({
      rows: [...store.values()],
    })),
    close: jest.fn().mockResolvedValue(undefined),
    diagnostics: jest.fn().mockResolvedValue({ version: "7.2.0" }),
    transactions: jest.fn().mockReturnValue({
      run: jest.fn().mockImplementation((fn) =>
        fn({
          insert: mockCollection.insert,
          get: mockCollection.get,
          replace: mockCollection.replace,
          remove: mockCollection.remove,
        }),
      ),
    }),
  }

  return {
    connect: jest.fn().mockResolvedValue(mockCluster),
    Cluster: jest.fn(() => mockCluster),
    Bucket: jest.fn(() => mockBucket),
    Collection: jest.fn(() => mockCollection),
  }
})

describe("CouchbaseModule", () => {
  const definedCollection = [Breed, BreedNoKey, Owner]
  let cluster: Cluster
  let bucket: Bucket
  let service: CouchBaseService
  let app, module: TestingModule

  describe("forRoot", () => {
    it("should connect and provide cluster/bucket", async () => {
      module = await Test.createTestingModule({
        imports: [
          CouchBaseModule.forRoot({
            connectionString: "couchbase://localhost",
            username: "admin",
            password: "password",
            bucketName: "test",
          }),
          CouchBaseModule.forFeature(definedCollection),
        ],
      }).compile()

      app = module.createNestApplication()
      await app.init()

      service = module.get(CouchBaseService)
      cluster = module.get("COUCHBASE_CLUSTER")
      bucket = module.get("COUCHBASE_BUCKET")

      expect(service).toBeDefined()
      expect(cluster).toBeDefined()
      expect(bucket).toBeDefined()
    })

    it("should inject models via forFeature", () => {
      definedCollection.forEach((a) => {
        const model = module.get<CouchBaseModel<typeof a>>(
          getModelToken(a.name),
        )
        expect(model).toBeDefined()
      })
    })
  })

  describe("forRootAsync", () => {
    it("should connect and provide cluster/bucket", async () => {
      module = await Test.createTestingModule({
        imports: [
          CouchBaseModule.forRootAsync({
            useFactory: () => ({
              connectionString: "couchbase://localhost",
              username: "admin",
              password: "password",
              bucketName: "test",
            }),
          }),
          CouchBaseModule.forFeature(definedCollection),
        ],
      }).compile()

      app = module.createNestApplication()
      await app.init()

      service = module.get(CouchBaseService)
      cluster = module.get("COUCHBASE_CLUSTER")
      bucket = module.get("COUCHBASE_BUCKET")

      expect(service).toBeDefined()
      expect(cluster).toBeDefined()
      expect(bucket).toBeDefined()
    })

    it("should inject models via forFeature", () => {
      definedCollection.forEach((a) => {
        const model = module.get<CouchBaseModel<typeof a>>(
          getModelToken(a.name),
        )
        expect(model).toBeDefined()
      })
    })
  })

  afterEach(async () => {
    await app.close()
  })

  afterAll(async () => {
    await app.close()
  })
})
