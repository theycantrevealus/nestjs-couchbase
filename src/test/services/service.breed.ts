import { Injectable } from "@nestjs/common"
import { InjectModel } from "../../decorator"
import { CouchBaseModel } from "../../model"
import { CreateBreedDto } from "../dto"
import { Breed } from "../schema/breed"

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
    try {
      return await this.breedModel.create(data)
    } catch (e) {
      console.error(e)
    }
  }
}
