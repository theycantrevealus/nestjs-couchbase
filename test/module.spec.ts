import { Test } from "@nestjs/testing"
import { Bucket, Cluster } from "couchbase"

import { Breed, BreedNoKey } from "./model/breed"
import {
  CouchBaseModel,
  CouchBaseModule,
  getModelToken,
  PropOptions,
} from "../src"
import { CouchBaseService } from "../src/service"
import { Owner } from "./model/owner"
import { PROP_METADATA_KEY } from "../src/constant"
import { getSchemaOptions, subChildField } from "../src/util"

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

beforeEach(() => {
  resetStore()
})

describe("CouchbaseModule (Dynamic)", () => {
  let cluster: Cluster
  let bucket: Bucket
  let service: CouchBaseService
  let breedModel: CouchBaseModel<Breed>
  let breedNoKeyModel: CouchBaseModel<BreedNoKey>
  let ownerModel: CouchBaseModel<Owner>
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
        CouchBaseModule.forFeature([Breed, BreedNoKey, Owner]),
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
    ownerModel = module.get<CouchBaseModel<Owner>>(getModelToken(Owner.name))
  })

  afterEach(async () => {
    await app.close()
  })

  describe("Resource Management", () => {
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

    it("should close cluster on shutdown", async () => {
      await app.close()
      expect(cluster.close).toHaveBeenCalled()
    })
  })

  describe("Collection Property", () => {
    // it("should avoid create unregistered field", async () => {
    //   const testData = {
    //     wrong: "value",
    //     name: "Test",
    //   }

    //   const processData = await breedModel.create(testData)
    //   console.log(processData)
    // })

    it("{ timestamp } should apply timestamps", async () => {
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

    it("{ required } should ask for required field", async () => {
      const testData = {
        name: "",
      }

      expect(async () => {
        await breedModel.create(testData)
      }).rejects.toThrow()
    })

    it("{ default } should set the default value if not set. String type", async () => {
      const testData = {
        name: "Example",
      }

      const props: {
        property: string
        options: PropOptions
      }[] = Reflect.getMetadata(PROP_METADATA_KEY, breedModel.targetSchemaClass)

      const processData = await breedModel.create(testData)
      subChildField(testData).forEach((field) => {
        const found = props.filter((configured) => configured.options.default)
        if (found.length > 0) {
          found.forEach((testItem) => {
            if (typeof testItem.options.default === "function") {
              expect(processData).toHaveProperty(
                testItem.property,
                testItem.options.default(),
              )
            } else {
              expect(processData).toHaveProperty(
                testItem.property,
                testItem.options.default,
              )
            }
          })
        }
      })
    })

    it("{ default } should set the default value if not set. Fn type", async () => {
      const testData = {
        name: "Example",
      }

      const props: {
        property: string
        options: PropOptions
      }[] = Reflect.getMetadata(
        PROP_METADATA_KEY,
        breedNoKeyModel.targetSchemaClass,
      )

      const processData = await breedNoKeyModel.create(testData)
      subChildField(testData).forEach((field) => {
        const found = props.filter((configured) => configured.options.default)
        if (found.length > 0) {
          found.forEach((testItem) => {
            if (typeof testItem.options.default === "function") {
              expect(processData).toHaveProperty(
                testItem.property,
                testItem.options.default(),
              )
            } else {
              expect(processData).toHaveProperty(
                testItem.property,
                testItem.options.default,
              )
            }
          })
        }
      })
    })

    it("{ default } should set the default value if not set. Object/Class type", async () => {
      const testData = {
        name: "John",
        username: "johnhere",
      }

      const props: {
        property: string
        options: PropOptions
      }[] = Reflect.getMetadata(PROP_METADATA_KEY, ownerModel.targetSchemaClass)

      const processData = await ownerModel.create(testData)
      subChildField(testData).forEach((field) => {
        const found = props.filter((configured) => configured.options.default)
        if (found.length > 0) {
          found.forEach((testItem) => {
            if (typeof testItem.options.default === "function") {
              expect(processData).toHaveProperty(
                testItem.property,
                testItem.options.default(),
              )
            } else {
              expect(processData).toHaveProperty(
                testItem.property,
                testItem.options.default,
              )
            }
          })
        }
      })
    })

    it("{ transform } should apply for transform prop", async () => {
      const testData = {
        name: "John",
        username: "johnhere",
      }

      const processData = await ownerModel.create(testData)
      const props: {
        property: string
        options: PropOptions
      }[] = Reflect.getMetadata(PROP_METADATA_KEY, ownerModel.targetSchemaClass)

      subChildField(testData).forEach((field) => {
        const found = props.filter(
          (configured) =>
            configured.property === field && configured.options.transform,
        )
        if (found.length > 0) {
          found.forEach((testItem) => {
            expect(processData[testItem.property]).toBe(
              testItem.options.transform(testData[testItem.property]),
            )
          })
        }
      })
    })

    it("{ validate } should validate the field value", async () => {
      const testData = {
        name: "John",
        username: "johnhere",
        contact: {
          phone: "wrong_phone",
          email: "wrong_email",
        },
      }

      expect(async () => {
        await ownerModel.create(testData)
      }).rejects.toThrow()
    })

    it("{ validate } should validate the primitive object value", async () => {
      const testData = {
        name: "John",
        username: "johnhere",
        attr: {
          val_one: "qwerty",
          val_two: "asdfgh",
        },
      }

      const createProcess = await ownerModel.create(testData)
      expect(createProcess).toHaveProperty("name")
      expect(createProcess).toHaveProperty("username")
      expect(createProcess).toHaveProperty("attr.val_one")
      expect(createProcess).toHaveProperty("attr.val_two")
    })

    it("{ validate } should validate timestamp data is exist", async () => {
      const testData = {
        name: "Example",
      }

      const processData = await breedNoKeyModel.create(testData)
      const actualData = await breedNoKeyModel.get(processData.id)
      expect(actualData).toHaveProperty("created_at")
      expect(actualData).toHaveProperty("updated_at")
      expect(actualData).toHaveProperty("deleted_at")
    })
  })

  describe("Positive", () => {
    it("Accept correct data", async () => {
      const testData = {
        name: "John",
        username: "johnhere",
        contact: {
          phone: "+6285261510202",
          email: "john@example.com",
        },
      }

      const createProcess = await ownerModel.create(testData)
      expect(createProcess).toHaveProperty("id")
      expect(createProcess).toHaveProperty("name")
      expect(createProcess).toHaveProperty("contact")
    })
  })
})
