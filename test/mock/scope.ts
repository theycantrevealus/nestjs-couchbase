import { mockCollection } from "./collection"

export const mockScope = {
  collection: jest.fn().mockReturnValue(mockCollection),
}
