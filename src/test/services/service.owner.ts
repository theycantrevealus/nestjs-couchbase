import { Injectable } from "@nestjs/common"
import { InjectModel } from "../../decorator"
import { CouchBaseModel } from "../../model"
import { Owner } from "../schema/owner"

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
