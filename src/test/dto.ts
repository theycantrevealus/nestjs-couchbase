import { Breed } from "./schema/breed"
import { Owner } from "./schema/owner"

export class CreateBreedDto {
  name: string
  remark: string
}

export class UpdateBreedDto {
  name: string
  remark: string
}

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
