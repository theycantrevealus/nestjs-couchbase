import { Test, TestingModule } from "@nestjs/testing"
import { ScenarioModule } from "./module"
import { BreedService } from "./services/service.breed"
import { CatService } from "./services/service.cat"
import { OwnerService } from "./services/service.owner"
import { CreateBreedDto } from "./dto"
import * as dotenv from "dotenv"
import { CouchBaseService } from "../service"

dotenv.config({
  path: `${process.cwd()}/${
    !process.env.NODE_ENV ||
    process.env.NODE_ENV === "development" ||
    process.env.NODE_ENV === "test" ||
    process.env.NODE_ENV === ""
      ? ""
      : process.env.NODE_ENV
  }.env`,
})

export const breedList: CreateBreedDto[] = [
  {
    name: "Siamese",
    remark:
      "Siamese Cats are incredibly social, intelligent and vocal—they'll talk to anyone who wants to listen, and even those who don't.",
  },
  {
    name: "Bengal",
    remark:
      "Bengal Cats are curious and confident with the tameness of a domestic tabby and the beauty of an Asian Leopard Cat.",
  },
  {
    name: "Maine Coon",
    remark:
      "Maine Coon cats are gentle natured and friendly, making them good companions. They are often tenderly playful and curious, making them kitten-like throughout their lives.",
  },
]

describe("Couchbase actual test", () => {
  let moduleRef: TestingModule
  let breedService: BreedService

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [ScenarioModule],
    }).compile()
    const app = moduleRef.createNestApplication()
    await app.init()
    breedService = moduleRef.get<BreedService>(BreedService)
  })

  describe("Breed CRUD", () => {
    it("should be able to create data", async () => {
      const testData: CreateBreedDto = {
        name: "Siamese",
        remark:
          "Siamese Cats are incredibly social, intelligent and vocal—they'll talk to anyone who wants to listen, and even those who don't.",
      }

      const createProcess = await breedService.create(testData)
      expect(createProcess).toHaveProperty("id")
      expect(createProcess).toHaveProperty("name", testData.name)
      expect(createProcess).toHaveProperty("remark", testData.remark)
    })
  })
})
