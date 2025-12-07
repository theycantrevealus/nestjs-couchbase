import { Module } from "@nestjs/common"
import { CatService } from "./services/service.cat"
import { OwnerService } from "./services/service.owner"
import { CouchBaseModule } from "../module"
import { ConfigModule, ConfigService } from "@nestjs/config"
import { BreedService } from "./services/service.breed"
import { Breed } from "./schema/breed"
import { Cat } from "./schema/cat"
import { Owner } from "./schema/owner"

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
    CouchBaseModule.forFeature([Breed]),
  ],
  providers: [BreedService],
  exports: [BreedService],
})
export class ScenarioModule {}
