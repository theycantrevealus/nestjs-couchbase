import { Injectable } from "@nestjs/common"
import { CreateBreedDto } from "../dto"
import { Breed } from "../schema/breed"
import { CouchBaseModel, InjectModel } from "../../src"

@Injectable()
export class BreedService {
  constructor(
    @InjectModel(Breed.name) private readonly breedModel: CouchBaseModel<Breed>,
  ) {}

  async findBreed(
    filter: any = {},
    sort: any = {},
    page: number = 1,
    limit: number = 10,
  ) {
    return this.breedModel.find(filter, {
      skip: (page - 1) * limit,
      limit,
      sort,
    })
  }

  async create(data: CreateBreedDto) {
    return this.breedModel.create(data)
  }

  async clearAllBreed() {
    await this.breedModel.deleteMany({})
  }
}
