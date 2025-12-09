import { Injectable } from "@nestjs/common"
import { CreateCatDto, UpdateCatDto } from "../dto"
import { Cat } from "../schema/cat"
import { CouchBaseModel, InjectModel } from "../../src"

@Injectable()
export class CatService {
  constructor(
    @InjectModel(Cat.name) private readonly catModel: CouchBaseModel<Cat>,
  ) {}

  async findCat(
    filter: any = {},
    sort: any = {},
    page: number = 1,
    limit: number = 10,
  ) {
    return this.catModel.find(filter, {
      skip: (page - 1) * limit,
      limit,
      sort,
    })
  }

  async countCat() {
    return this.catModel.count()
  }

  async createCat(data: CreateCatDto) {
    return await this.catModel.create(data)
  }

  async getCatOlderThan10() {
    return this.catModel.find({
      age: { $gt: 10 },
    })
  }

  async updateCat(id: string, data: UpdateCatDto) {
    return this.catModel.update(id, data)
  }

  async deleteCat(id: string) {
    return this.catModel.remove(id)
  }

  async deleteSoftCat(id: string) {
    return this.catModel.removeSoft(id)
  }

  async getStats() {
    const result = await this.catModel.query(`
        SELECT name, age, breed, COUNT(*) as count
        FROM \`bucket_sample\`.\`scope_sample\`.\`Cat\`
        GROUP BY breed
      `)
    return result.rows
  }
}
