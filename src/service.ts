// couchbase.service.ts
import { Inject, Injectable } from "@nestjs/common"
import { Bucket, Cluster } from "couchbase"

@Injectable()
export class CouchBaseService {
  constructor(
    @Inject("COUCHBASE_BUCKET") private readonly bucket: Bucket,
    @Inject("COUCHBASE_CLUSTER") private readonly cluster: Cluster,
  ) {}

  getBucket(): Bucket {
    return this.bucket
  }

  getCluster(): Cluster {
    return this.cluster
  }

  async query(query: string, options?: any): Promise<any> {
    return await this.cluster.query(query, options)
  }

  async getDocument(id: string): Promise<any> {
    const collection = this.bucket.defaultCollection()
    const result = await collection.get(id)
    return result.content
  }
}
