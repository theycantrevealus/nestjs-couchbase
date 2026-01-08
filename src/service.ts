import {
  Inject,
  Injectable,
  OnApplicationBootstrap,
  OnApplicationShutdown,
} from "@nestjs/common"
import { Bucket, Cluster } from "couchbase"
import { createAllUniqueIndexes, getAllUniqueIndexes } from "./util"
import { DiscoveryService } from "@nestjs/core"

@Injectable()
export class CouchBaseService
  implements OnApplicationShutdown, OnApplicationBootstrap
{
  constructor(
    @Inject("COUCHBASE_BUCKET") private readonly bucket: Bucket,
    @Inject("COUCHBASE_CLUSTER") private readonly cluster: Cluster,
  ) {}

  async onApplicationBootstrap() {
    await this.createUniqueIndexes()
  }

  async onApplicationShutdown() {
    try {
      await this.cluster.close()
    } catch (error) {
      console.error("Error closing Couchbase cluster:", error)
    }
  }

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

  private async createUniqueIndexes() {
    const indexes = getAllUniqueIndexes()

    for (const idx of indexes) {
      const fieldList = idx.fields.map((f) => `\`${f}\``).join(", ")
      const caseSensitive = idx.caseSensitive ? "" : " COLLATE UTF8_UNICODE_CI"

      const query = `
        CREATE INDEX IF NOT EXISTS \`${idx.indexName}\`
        ON \`${this.bucket.name}\`.\`${idx.scope}\`.\`${idx.collection}\`(${fieldList})${caseSensitive}
        WHERE \`deletedAt\` IS NULL
      `

      try {
        await this.cluster.query(query)
      } catch (err: any) {
        if (!err.message.includes("already exists"))
          console.warn(`Failed to create index ${idx.indexName}:`, err)
      }
    }

    for (const idx of indexes) {
      await this.cluster.query(
        `BUILD INDEX ON \`${idx.collection}\`(\`${idx.indexName}\`)`,
      )
    }
  }
}

@Injectable()
export class IndexBootstrapService implements OnApplicationBootstrap {
  constructor(private readonly discovery: DiscoveryService) {}

  async onApplicationBootstrap() {
    await createAllUniqueIndexes()
  }
}
