import { BelongsTo, HasMany, HasOne, Prop, Schema } from "../decorator"
import { Unique } from "../util"

enum Status {
  HEALTHY = "healthy",
  SICK = "sick",
  QUANRANTINE = "quarantine",
}

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
  collection: "Breed",
  timestamps: {
    createdAt: "created_at",
    updatedAt: "updated_at",
    deletedAt: "deleted_at",
  },
})
export class Breed {
  @Prop({ required: true })
  name: string

  @Prop({ required: false, default: "-" })
  remark: string
}

@Schema({
  collection: "Cat",
  timestamps: {
    createdAt: "created_at",
    updatedAt: "updated_at",
    deletedAt: "deleted_at",
  },
})
export class Cat {
  @Prop({ required: true, unique: true })
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

@Schema({
  collection: "Owner",
  timestamps: {
    createdAt: "created_at",
    updatedAt: "updated_at",
    deletedAt: "deleted_at",
  },
})
// @Unique(["email"], { name: "uniq_users_email" })
@Unique(["username"])
export class Owner {
  @Prop({
    required: true,
    transform: (value: string) => `CatLover ${value.trim()}`,
  })
  name: string

  username: string

  @HasMany(() => Cat)
  cats: Cat[]

  @Prop({ type: () => OwnerContact })
  contact: OwnerContact
}
