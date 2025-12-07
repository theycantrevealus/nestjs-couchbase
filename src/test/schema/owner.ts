import { HasMany, Prop, Schema } from "../../decorator"
import { Cat } from "./cat"

export class OwnerContact {
  @Prop({
    validate: (v: string) => /^\\+[1-9][0-9]{7,14}$/.test(v),
    validateMessage: "must be valid phone number",
  })
  phone: string

  @Prop({
    validate: (v: string) =>
      /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(v),
    validateMessage: "must be valid email",
  })
  email: string
}

@Schema({
  collection: "owner",
  timestamps: {
    createdAt: "created_at",
    updatedAt: "updated_at",
    deletedAt: "deleted_at",
  },
})
// @Unique(["email"], { name: "uniq_users_email" })
// @Unique(["username"])
export class Owner {
  @Prop({
    required: true,
    transform: (value: string) => `CatLover ${value.trim()}`,
  })
  name: string

  username: string

  @Prop({ type: () => OwnerContact })
  contact: OwnerContact
}
