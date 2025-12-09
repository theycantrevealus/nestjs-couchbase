import { mockCollection } from "./collection"
import { mockScope } from "./scope"

export const mockBucket = {
  defaultCollection: jest.fn().mockReturnValue(mockCollection),
  scope: jest.fn().mockReturnValue(mockScope),
  collections: jest.fn().mockReturnValue({
    createCollection: jest.fn(),
    createScope: jest.fn(),
  }),
}
