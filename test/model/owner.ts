import { Type } from "class-transformer"
import { Prop, Schema } from "../../src"
import { Key } from "../../src/util"
import { ValidateNested } from "class-validator"

// @Unique(["email"], { name: "uniq_users_email" })
// @Unique(["username"])

// @ValidatorConstraint({ name: "phone", async: false })
// export class PhoneValidator implements ValidatorConstraintInterface {
//   validate(value: any, args: ValidationArguments): boolean {
//     return typeof value === "string" && /^\+[1-9][0-9]{7,14}$/.test(value)
//   }

//   defaultMessage(args: ValidationArguments): string {
//     return "must be valid phone number"
//   }
// }

// @ValidatorConstraint({ name: "phone", async: false })
// export class EmailValidator implements ValidatorConstraintInterface {
//   validate(value: any, args: ValidationArguments): boolean {
//     return (
//       typeof value === "string" &&
//       /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value)
//     )
//   }

//   defaultMessage(args: ValidationArguments): string {
//     return "must be valid email"
//   }
// }

export class OwnerContact {
  @Prop({
    validate: (value) => /^\+[1-9][0-9]{7,14}$/.test(value),
    validateMessage: "must be valid phone number",
  })
  // @Validate(PhoneValidator)
  phone: string

  @Prop({
    validate: (value) =>
      /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value),
    validateMessage: "must be valid email",
  })
  // @Validate(EmailValidator)
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
export class Owner {
  @Prop({
    required: true,
    transform: (value: string) => `CatLover ${value.trim()}`,
  })
  @Key({ prefix: "owner_name::" })
  name: string

  @Prop()
  @Key({ prefix: "username::" })
  username: string

  @Type(() => OwnerContact)
  @ValidateNested({ each: false })
  @Prop({ type: () => OwnerContact, required: false })
  contact?: OwnerContact

  @Type(() => Object)
  @Prop({ required: false, default: {} })
  attr?: Object
}
