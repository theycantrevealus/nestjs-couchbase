import { Injectable } from "@nestjs/common"
import { Owner } from "../schema/owner"
import { CouchBaseModel, InjectModel } from "../../src"

@Injectable()
export class OwnerService {
  constructor(
    @InjectModel(Owner.name) private readonly ownerModel: CouchBaseModel<Owner>,
  ) {}

  async getCatByOwnerId(id: string) {
    const owner = await this.ownerModel.findById(id)
    await this.ownerModel.populate(owner, "cats")
  }
}
