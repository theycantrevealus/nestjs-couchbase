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

## Test

```shell
# Mocked
npm run test

# For actual connection
npm run test:actual

```

## Getting Started (Unpublished yet !!!)

### Sync Module

```typescript
@Module({
  imports: [
    CouchbaseModule.forRoot({
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
    CouchbaseModule.forRootAsync({
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

## Configuration

You can configure the module using environment variables or directly in the `forRoot` method:

```typescript
NestOttomanModule.forRoot({
  connectionOptions: {
    connectionString: process.env.COUCHBASE_URI,
    username: process.env.COUCHBASE_USER,
    password: process.env.COUCHBASE_PASSWORD,
    bucketName: process.env.COUCHBASE_BUCKET,
  },
  ottomanOptions: {
    scopeName: "_default",
    collectionName: "_default",
  },
})
```

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository.
2. Create a new feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -am 'Add new feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Create a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
