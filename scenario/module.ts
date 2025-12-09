import { Module } from "@nestjs/common"
import { ConfigModule, ConfigService } from "@nestjs/config"
import { BreedService } from "./services/service.breed"
import { Breed } from "./schema/breed"
import { Cat } from "./schema/cat"
import { Owner } from "./schema/owner"
import { CouchBaseModule } from "../src"

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
