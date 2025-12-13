import { Prop, Schema } from "../../src"
import { Key } from "../../src/util"

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
  @Key({ prefix: "breed_name::" })
  name: string

  @Prop({ required: false, default: "-" })
  remark: string
}

@Schema({
  collection: "breed_no_key",
  timestamps: {
    createdAt: "created_at",
    updatedAt: "updated_at",
    deletedAt: "deleted_at",
  },
})
export class BreedNoKey {
  @Prop({ required: true })
  name: string

  @Prop({ required: false, default: () => "-" })
  remark: string
}
