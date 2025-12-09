import { mockBucket as Bucket } from "./bucket"
import { mockCluster as Cluster } from "./cluster"

Cluster.bucket.mockReturnValue(Bucket)
const connect = jest.fn().mockResolvedValue(Cluster)
export const couchbaseMock = {
  connect,
  Cluster,
  Bucket,
}
