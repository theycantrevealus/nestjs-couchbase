import { Breed } from "../../scenario/schema/breed"

export const mockBreed = (name = "", remark = ""): Breed => ({
  name,
  remark,
})

export const mockBreedModel = {
  create: jest.fn().mockResolvedValue(mockBreed()),
  find: jest.fn().mockImplementation(),
  aggregate: jest.fn().mockImplementation(),
  generateId: jest.fn().mockResolvedValue(""),
}

export const breedArray = [
  mockBreed(),
  mockBreed(
    "Siamese",
    "Siamese Cats are incredibly social, intelligent and vocal—they'll talk to anyone who wants to listen, and even those who don't.",
  ),
  mockBreed(
    "Maine Coon",
    "Maine Coon cats are gentle natured and friendly, making them good companions. They are often tenderly playful and curious, making them kitten-like throughout their lives.",
  ),
]
