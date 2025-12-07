import {
  Inject,
  Injectable,
  OnApplicationShutdown,
  OnModuleInit,
} from "@nestjs/common"
import { Bucket, Cluster } from "couchbase"

@Injectable()
export class CouchBaseService implements OnApplicationShutdown, OnModuleInit {
  constructor(
    @Inject("COUCHBASE_BUCKET") private readonly bucket: Bucket,
    @Inject("COUCHBASE_CLUSTER") private readonly cluster: Cluster,
  ) {}

  async onModuleInit() {
    // await this.createCollectionsIfNotExist()
  }

  async onApplicationShutdown() {
    console.log("Closing Couchbase cluster...")
    try {
      await this.cluster.close()
      console.log("Couchbase cluster closed gracefully")
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
}

// @Injectable()
// export class CouchBaseIndexManager implements OnModuleInit {
//   constructor(private readonly cluster: Cluster) {}

//   async onModuleInit() {
//     await this.createUniqueIndexes()
//   }

//   private async createUniqueIndexes() {
//     const indexes = getAllUniqueIndexes()

//     for (const idx of indexes) {
//       const fieldList = idx.fields.map((f) => `\`${f}\``).join(", ")
//       const caseSensitive = idx.caseSensitive ? "" : " COLLATE UTF8_UNICODE_CI"

//       const query = `
//         CREATE UNIQUE INDEX IF NOT EXISTS \`${idx.indexName}\`
//         ON \`${idx.collection}\`(${fieldList})${caseSensitive}
//         WHERE deletedAt IS NULL
//       `

//       try {
//         await this.cluster.query(query)
//         console.log(`Unique index created: ${idx.indexName}`)
//       } catch (err: any) {
//         if (!err.message.includes("already exists")) {
//           console.warn(`Failed to create index ${idx.indexName}:`, err.message)
//         }
//       }
//     }

//     for (const idx of indexes) {
//       await this.cluster.query(
//         `BUILD INDEX ON \`${idx.collection}\`(\`${idx.indexName}\`)`,
//       )
//     }
//   }
// }
