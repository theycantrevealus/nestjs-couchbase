import { Test, TestingModule } from "@nestjs/testing"
import { CreateBreedDto } from "./dto"
import { ConfigModule, ConfigService } from "@nestjs/config"
import { Breed } from "./schema/breed"
import { Cluster } from "couchbase"
import { CouchBaseModel, CouchBaseModule, getModelToken } from "../src"
import { COUCHBASE_CLUSTER } from "../src/constant"
import { DiscoveryService } from "@nestjs/core"

describe("Couchbase actual test", () => {
  let moduleRef: TestingModule
  let cluster: Cluster
  let app

  let discoveryService: DiscoveryService
  let breedModel: CouchBaseModel<Breed>

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot(),
        CouchBaseModule.forRootAsync({
          imports: [ConfigModule],
          useFactory: async (configService: ConfigService) => ({
            connectionString:
              configService.get("COUCHBASE_CONNECTION_STRING") || "",
            username: configService.get("COUCHBASE_USERNAME") || "",
            password: configService.get("COUCHBASE_PASSWORD") || "",
            bucketName: configService.get("COUCHBASE_BUCKET") || "",
          }),
          inject: [ConfigService],
        }),
        CouchBaseModule.forFeature([Breed]),
      ],
    }).compile()
    app = moduleRef.createNestApplication()
    await app.init()
    cluster = moduleRef.get<Cluster>(COUCHBASE_CLUSTER)
    discoveryService = moduleRef.get<DiscoveryService>(DiscoveryService)
    breedModel = moduleRef.get<CouchBaseModel<Breed>>(getModelToken(Breed.name))
  })

  beforeEach(async () => {
    await breedModel.query("DELETE FROM `testing`.`_default`.`breed`")
  })

  afterEach(async () => {
    await breedModel.query("DELETE FROM `testing`.`_default`.`breed`")
  })

  describe("Couchbase module injection test", () => {
    it("should load all services", async () => {
      expect(discoveryService).toBeDefined()
      expect(cluster)
      expect(discoveryService).toBeDefined()
    })
  })

  describe("Breed CRUD", () => {
    it("should be able to create data", async () => {
      const testData: CreateBreedDto = {
        name: "Siamese",
        remark:
          "Siamese Cats are incredibly social, intelligent and vocal—they'll talk to anyone who wants to listen, and even those who don't.",
      }

      const createProcess = await breedModel.create(testData)
      expect(createProcess).toHaveProperty("id")
      expect(createProcess).toHaveProperty("name", testData.name)
      expect(createProcess).toHaveProperty("remark", testData.remark)
    })

    it("should be able to handle duplicate data", async () => {
      const testData: CreateBreedDto = {
        name: "Siamese",
        remark:
          "Siamese Cats are incredibly social, intelligent and vocal—they'll talk to anyone who wants to listen, and even those who don't.",
      }

      await breedModel.create(testData)
      try {
        await breedModel.create(testData)
        fail("Expected error was not thrown")
      } catch (e: any) {
        expect(e.message).toContain("document exists")
      }
    })

    it("should be able to find data", async () => {
      const testData: CreateBreedDto = {
        name: "Siamese",
        remark:
          "Siamese Cats are incredibly social, intelligent and vocal—they'll talk to anyone who wants to listen, and even those who don't.",
      }

      await breedModel.create(testData).then(async () => {
        const found = await breedModel.find(
          {},
          {
            skip: 0,
            limit: 10,
            sort: { createdAt: 1 },
          },
        )
        expect(found).toBeInstanceOf(Array)
        expect(found).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              id: expect.stringMatching(new RegExp(`^${testData.name}$`)),
            }),
            expect.objectContaining({
              name: expect.stringMatching(new RegExp(`^${testData.name}$`)),
            }),
            expect.objectContaining({
              remark: expect.stringMatching(new RegExp(`^${testData.remark}$`)),
            }),
          ]),
        )
      })
    })

    it("should be able to update data", async () => {
      const firstData: CreateBreedDto = {
        name: "Siamese",
        remark:
          "Siamese Cats are incredibly social, intelligent and vocal—they'll talk to anyone who wants to listen, and even those who don't.",
      }
      await breedModel.create(firstData).then(async () => {
        const updateData: CreateBreedDto = {
          name: "Bengal",
          remark:
            "Bengal Cats are curious and confident with the tameness of a domestic tabby and the beauty of an Asian Leopard Cat.",
        }
        const update = await breedModel.update(firstData.name, updateData)
        expect(update).toHaveProperty("id")
        expect(update).toHaveProperty("name", updateData.name)
        expect(update).toHaveProperty("remark", updateData.remark)
      })
    })

    it("should be able to soft delete data", async () => {
      const testData: CreateBreedDto = {
        name: "Maine Coon",
        remark:
          "Maine Coon cats are gentle natured and friendly, making them good companions. They are often tenderly playful and curious, making them kitten-like throughout their lives.",
      }
      await breedModel.create(testData).then(async () => {
        await breedModel.removeSoft(testData.name).then(async () => {
          const found = await breedModel.find(
            { name: testData.name },
            {
              skip: 0,
              limit: 10,
              sort: { createdAt: 1 },
            },
            true,
          )

          expect(found).toBeInstanceOf(Array)
          if (breedModel.configuration.timestamps) {
            if (typeof breedModel.configuration.timestamps === "boolean") {
              expect(found).toEqual(
                expect.arrayContaining([
                  expect.objectContaining({
                    id: expect.stringMatching(new RegExp(`^${testData.name}$`)),
                  }),
                  expect.objectContaining({
                    name: expect.stringMatching(
                      new RegExp(`^${testData.name}$`),
                    ),
                  }),
                  expect.objectContaining({
                    remark: expect.stringMatching(
                      new RegExp(`^${testData.remark}$`),
                    ),
                  }),
                  expect.objectContaining({
                    deletedAt: expect.anything(),
                  }),
                ]),
              )
            } else if (
              typeof breedModel.configuration.timestamps === "object"
            ) {
              const deletedAt = breedModel.configuration.timestamps.deletedAt
              expect(found).toEqual(
                expect.arrayContaining([
                  expect.objectContaining({
                    id: expect.stringMatching(new RegExp(`^${testData.name}$`)),
                  }),
                  expect.objectContaining({
                    name: expect.stringMatching(
                      new RegExp(`^${testData.name}$`),
                    ),
                  }),
                  expect.objectContaining({
                    remark: expect.stringMatching(
                      new RegExp(`^${testData.remark}$`),
                    ),
                  }),
                  expect.objectContaining({
                    [deletedAt]: expect.anything(),
                  }),
                ]),
              )
            }
          }
        })
      })
    })

    it("should be able to hard delete data", async () => {
      const testData: CreateBreedDto = {
        name: "Maine Coon",
        remark:
          "Maine Coon cats are gentle natured and friendly, making them good companions. They are often tenderly playful and curious, making them kitten-like throughout their lives.",
      }

      await breedModel.create(testData).then(async () => {
        await breedModel.remove(testData.name).then(async () => {
          const found = await breedModel.find(
            { name: testData.name },
            {
              skip: 0,
              limit: 10,
              sort: { createdAt: 1 },
            },
            true,
          )

          expect(found).toBeInstanceOf(Array)
          expect(found).toHaveLength(0)
        })
      })
    })

    it("should be able to use ACID transaction", async () => {
      const testData: CreateBreedDto = {
        name: "Maine Coon",
        remark:
          "Maine Coon cats are gentle natured and friendly, making them good companions. They are often tenderly playful and curious, making them kitten-like throughout their lives.",
      }

      await cluster.transactions().run(async (ctx) => {
        await breedModel.create(testData, ctx).then(async () => {
          await breedModel.remove(testData.name, ctx).then(async () => {
            const found = await breedModel.find(
              { name: testData.name },
              {
                skip: 0,
                limit: 10,
                sort: { createdAt: 1 },
              },
              true,
            )

            expect(found).toBeInstanceOf(Array)
            expect(found).toHaveLength(0)
          })
        })
      })
    })
  })
})
