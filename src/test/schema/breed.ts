import { Prop, Schema } from "../../decorator"

@Schema({
  collection: "breed",
})
export class Breed {
  @Prop({ required: true })
  name: string

  @Prop({ required: false, default: "-" })
  remark: string
}
