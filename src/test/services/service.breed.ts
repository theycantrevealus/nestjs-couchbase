import { Injectable } from "@nestjs/common"
import { Breed } from "../schema"
import { InjectModel } from "../../decorator"
import { CouchBaseModel } from "../../model"

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
}
