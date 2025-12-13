import { Test, TestingModule } from "@nestjs/testing"
import { Bucket, Cluster } from "couchbase"
import { Breed, BreedNoKey } from "./model/breed"
import { CouchBaseModel, CouchBaseModule, getModelToken } from "../src"
import { CouchBaseService } from "../src/service"
import { Owner } from "./model/owner"

jest.mock("couchbase", () => {
  const mockManager = {
    createScope: jest.fn().mockResolvedValue(undefined),
    createCollection: jest.fn().mockResolvedValue(undefined),
  }

  const mockBucket = {
    name: "test_bucket",
    collections: jest.fn().mockReturnValue(mockManager),
    defaultCollection: jest.fn(),
    scope: jest.fn(),
  }

  const mockScope = {
    name: "_default",
    bucket: jest.fn(() => mockBucket),
    collection: jest.fn(),
  }

  const mockCollection = {
    insert: jest.fn().mockResolvedValue({ cas: BigInt(1) }),
    get: jest.fn(),
    upsert: jest.fn(),
    replace: jest.fn(),
    remove: jest.fn(),
    scope: mockScope,
  }

  mockBucket.defaultCollection.mockReturnValue(mockCollection)
  mockBucket.scope = jest.fn(() => mockScope)
  mockScope.collection = jest.fn(() => mockCollection)

  const mockCluster = {
    bucket: jest.fn().mockReturnValue(mockBucket),
    query: jest.fn().mockResolvedValue({ rows: [] }),
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
