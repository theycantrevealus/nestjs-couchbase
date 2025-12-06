import { Module } from "@nestjs/common"
import { CatService } from "./services/service.cat"
import { OwnerService } from "./services/service.owner"
import { CouchBaseModule } from "../module"
import { ConfigModule, ConfigService } from "@nestjs/config"
import { Breed, Cat, Owner } from "./schema"
import { BreedService } from "./services/service.breed"

@Module({
  imports: [
    ConfigModule.forRoot(),
    CouchBaseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        connectionString: configService.get("COUCHBASE_CONNECTION_STRING"),
        username: configService.get("COUCHBASE_USERNAME"),
        password: configService.get("COUCHBASE_PASSWORD"),
        bucketName: configService.get("COUCHBASE_BUCKET"),
      }),
      inject: [ConfigService],
    }),
    CouchBaseModule.forFeature([Breed, Cat, Owner]),
  ],
  providers: [BreedService, CatService, OwnerService],
  exports: [BreedService, CatService, OwnerService],
})
export class ScenarioModule {}
