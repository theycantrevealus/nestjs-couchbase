import { Test } from "@nestjs/testing"
import { Bucket, Cluster } from "couchbase"

import { Breed, BreedNoKey } from "./model/breed"
import { CouchBaseModel, CouchBaseModule, getModelToken } from "../src"
import { CouchBaseService } from "../src/service"

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

describe("CouchbaseModule (Dynamic)", () => {
  let cluster: Cluster
  let bucket: Bucket
  let service: CouchBaseService
  let breedModel: CouchBaseModel<Breed>
  let breedNoKeyModel: CouchBaseModel<BreedNoKey>
  let app

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [
        CouchBaseModule.forRootAsync({
          useFactory: () => ({
            connectionString: "couchbase://localhost",
            username: "admin",
            password: "password",
            bucketName: "test",
          }),
        }),
        CouchBaseModule.forFeature([Breed, BreedNoKey]),
      ],
    }).compile()

    app = module.createNestApplication()
    await app.init()

    service = module.get(CouchBaseService)
    cluster = module.get("COUCHBASE_CLUSTER")
    bucket = module.get("COUCHBASE_BUCKET")
    breedModel = module.get<CouchBaseModel<Breed>>(getModelToken(Breed.name))
    breedNoKeyModel = module.get<CouchBaseModel<BreedNoKey>>(
      getModelToken(BreedNoKey.name),
    )
  })

  it("should connect and provide cluster/bucket", () => {
    expect(service).toBeDefined()
    expect(cluster).toBeDefined()
    expect(bucket).toBeDefined()
  })

  it("should inject models via forFeature", () => {
    expect(breedModel).toBeDefined()
  })

  it("should create document with UUID when no @Key", async () => {
    const breedNoKey = await breedNoKeyModel.create({
      name: "Test",
      remark: "-",
    })

    expect(breedNoKey.id).toMatch(/^[0-9a-f]{8}-/)
    expect(breedNoKey.name).toBe(breedNoKey.name)
    expect(breedNoKey.remark).toBe(breedNoKey.remark)
  })

  it("should use @Key field as document ID", async () => {
    const breed = await breedModel.create({
      name: "Test",
      remark: "-",
    })

    expect(breed.id).toBe(breed.name)
    expect(breed.remark).toBe(breed.remark)
  })

  it("should apply timestamps", async () => {
    const breed = await breedModel.create({
      name: "Test",
      remark: "-",
    })
    if (breedModel.configuration.timestamps) {
      if (typeof breedModel.configuration.timestamps === "boolean") {
        expect(breed).toHaveProperty("createdAt")
        expect(breed).toHaveProperty("updatedAt")
        expect(breed).toHaveProperty("deletedAt")
      } else if (typeof breedModel.configuration.timestamps === "object") {
        for (const a in breedModel.configuration.timestamps) {
          expect(breed).toHaveProperty(breedModel.configuration.timestamps[a])
        }
      }
    }
  })

  it("should close cluster on shutdown", async () => {
    await app.close()
    expect(cluster.close).toHaveBeenCalled()
  })
})
