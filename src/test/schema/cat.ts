import { BelongsTo, HasOne, Prop, Schema } from "../../decorator"
import { Status } from "../enum"
import { Breed } from "./breed"
import { Owner } from "./owner"

@Schema({
  collection: "cat",
  timestamps: {
    createdAt: "created_at",
    updatedAt: "updated_at",
    deletedAt: "deleted_at",
  },
})
export class Cat {
  @Prop({ required: true })
  name: string

  @Prop()
  age: number

  @HasOne(() => Breed)
  breed: Breed

  @Prop({ enum: Status, default: Status.HEALTHY, enumName: "Status" })
  status: Status

  @BelongsTo(() => Owner)
  owner: Owner
}
