import { Breed, Owner } from "./schema"

export class CreateCatDto {
  name: string
  age: number
  breed: Breed
  owner: Owner
}

export class UpdateCatDto {
  name: string
  age: number
  breed: Breed
  owner: Owner
}
