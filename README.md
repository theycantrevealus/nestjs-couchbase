# NestJS x CouchBase

A NestJS library to seamlessly integrate **[Couchbase](https://www.couchbase.com/)**, enabling developers to leverage the power of Couchbase with the modular architecture of NestJS.

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Getting Started](#getting-started)
- [Usage](#usage)
- [Configuration](#configuration)
- [Contributing](#contributing)
- [License](#license)

## Features

- Easy integration of OttomanJS with NestJS applications.
- Provides decorators and modules to manage models and repositories.
- Supports Couchbase connection pooling.
- Fully compatible with NestJS dependency injection.
- Configurable through environment variables or configuration modules.

## Installation

```bash
npm install nestjs-couchbase couchbase
```

## Create configuration

Create `.env` file based from `.env.example` in root of project

## Test

```shell
# Mocked
npm run test

# For actual connection
npm run test:actual

```

## Getting Started

### Sync Module

```typescript
@Module({
  imports: [
    CouchBaseModule.forRoot({
      connectionString: "couchbase://localhost",
      username: "Administrator",
      password: "password",
      bucketName: "my_bucket",
    }),
  ],
})
export class AppModule {}
```

### Async Module

```typescript
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
  ],
})
export class AppModule {}
```

### Create Model

```typescript
@Schema({
  /**
   * Schema:
   * @param { string } collection - Define the collection name
   * @param { string } scope - Define the scope name
   * @param { boolean | any} timestamps - If you want auto create timestamp field. set true to generate default: createdAt, updatedAt, deletedAt
   */
  collection: "collection_name",
  /** timestamp: true or like below for custom named field for timestamp feature */
  timestamps: {
    createdAt: "created_at",
    updatedAt: "updated_at",
    deletedAt: "deleted_at",
  },
})
/**
 * Since couchbase not support built-in CREATE UNIQUE INDEX. This feature is still in discuss LOL
 * @Unique(["name"], { scope: "_default", name: "idx_testing_for_breed_name" })
 */
export class ModelClass {
  /**
   * Prop:
   * @param { boolean } required - Set true then it will required while create command
   * @param { boolean | any } unique - [Upcoming feature]
   * @param { boolean } each - Nested class validation
   * @param { string } ref - Foreign collection name for JOIN
   * @param { string } default - Default value if field not set on create command
   * @param { Array } enum - Array of something of allowed value
   * @param { string } enumName - Don't know just following couchbase documentation LOL
   * @param { Function } type - For nested class. Fill it with class for validate and each checking purpose
   * @param { boolean } validate - Validate but not nested like each
   * @param { string } validateMessage - Don't know just following couchbase documentation LOL
   * @param { any } transform - You could transform value here (class-transform)
   */
  @Prop({ required: true })
  @Key({ prefix: "any_name::" })
  name: string

  @Prop({ required: false, default: "-" })
  remark: string
}
```

### Add Model

```typescript
@Module({
  imports: [CouchBaseModule.forFeature([ModelClass])],
})
export class AppModule {}
```

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository.
2. Create a new feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -am '<semantic-rule>:Add new feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Create a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.<br />
I created this library with tears. Contribute or give me star will be appreciated ♥️
