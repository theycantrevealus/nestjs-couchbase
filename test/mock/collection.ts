export const mockCollection = {
  insert: jest.fn().mockResolvedValue({ cas: BigInt(1) }),
  get: jest.fn(),
  upsert: jest.fn(),
  replace: jest.fn(),
  remove: jest.fn(),
}
