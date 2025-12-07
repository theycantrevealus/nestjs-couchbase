import { Prop, Schema } from "../../decorator"
import { Unique } from "../../util"

@Schema({
  collection: "breed",
  timestamps: {
    createdAt: "created_at",
    updatedAt: "updated_at",
    deletedAt: "deleted_at",
  },
})
// @Unique(["name"], { scope: "_default", name: "idx_testing_for_breed_name" })
export class Breed {
  @Prop({ required: true })
  name: string

  @Prop({ required: false, default: "-" })
  remark: string
}
