import { mockBucket } from "./bucket"

export const mockCluster = {
  bucket: jest.fn().mockReturnValue(mockBucket),
  query: jest.fn().mockResolvedValue({ rows: [] }),
  close: jest.fn().mockResolvedValue(undefined),
  diagnostics: jest.fn().mockResolvedValue({ version: "7.2.0" }),
}
