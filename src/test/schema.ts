import { BelongsTo, HasMany, HasOne, Prop, Schema } from "../decorator"

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

  @Prop({ required: false })
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
  @Prop({ required: true })
  name: string

  @Prop()
  age: number

  @HasOne(() => Breed)
  breed: Breed

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
export class Owner {
  @Prop({ required: true })
  name: string

  @HasMany(() => Cat)
  cats: Cat[]
}
