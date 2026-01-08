## [1.8.2](https://github.com/theycantrevealus/nestjs-couchbase/compare/v1.8.1...v1.8.2) (2026-01-08)


### Bug Fixes

* include util export for util decorator ([d1759e6](https://github.com/theycantrevealus/nestjs-couchbase/commit/d1759e6cfbeba6682357d0cdd229b66146f19c10))

## [1.8.1](https://github.com/theycantrevealus/nestjs-couchbase/compare/v1.8.0...v1.8.1) (2025-12-19)


### Bug Fixes

* relation field should save only id ([775d04b](https://github.com/theycantrevealus/nestjs-couchbase/commit/775d04bac3e8d671e88492d448f1b142726477a7))

# [1.8.0](https://github.com/theycantrevealus/nestjs-couchbase/compare/v1.7.2...v1.8.0) (2025-12-15)


### Bug Fixes

* dynamic timestamp field from model schema ([ba4493b](https://github.com/theycantrevealus/nestjs-couchbase/commit/ba4493bb3db17b093d7f697c08a054053a04f476))
* timestamp on get operation, close [#10](https://github.com/theycantrevealus/nestjs-couchbase/issues/10) ([39ea3fd](https://github.com/theycantrevealus/nestjs-couchbase/commit/39ea3fd1489a23ea4944aad75c14943dce362318))


### Features

* apply local storage for module testing, close [#11](https://github.com/theycantrevealus/nestjs-couchbase/issues/11) ([39c3903](https://github.com/theycantrevealus/nestjs-couchbase/commit/39c3903ff8353ab06117cc3ba12cb4588155b544))

## [1.7.2](https://github.com/theycantrevealus/nestjs-couchbase/compare/v1.7.1...v1.7.2) (2025-12-13)


### Bug Fixes

* default field default with test ([d3290d4](https://github.com/theycantrevealus/nestjs-couchbase/commit/d3290d42d2031357e4a54ee1aab08ddc8c1620da))
* separate applyDefault fn & support default for object/class type ([73cb216](https://github.com/theycantrevealus/nestjs-couchbase/commit/73cb216aabf131bb12d93481f06b214f0fce6efd))

## [1.7.1](https://github.com/theycantrevealus/nestjs-couchbase/compare/v1.7.0...v1.7.1) (2025-12-11)


### Bug Fixes

* primitive object validator ([b62780b](https://github.com/theycantrevealus/nestjs-couchbase/commit/b62780b3b387d6b6028e109db342e86669114f49))
* validation for field with subclass support ([4ad2b94](https://github.com/theycantrevealus/nestjs-couchbase/commit/4ad2b94b71c408b05e02072e414620bd58fd1cf9))

# [1.7.0](https://github.com/theycantrevealus/nestjs-couchbase/compare/v1.6.0...v1.7.0) (2025-12-10)


### Bug Fixes

* exclude parameters on QueryOptionsExt so it could extend QueryOptions natively ([8c5ec9e](https://github.com/theycantrevealus/nestjs-couchbase/commit/8c5ec9ed3f02fce56f0242dc8db5c844674e8393))
* export DiscoveryService for dep usage on import ([7a15ca3](https://github.com/theycantrevealus/nestjs-couchbase/commit/7a15ca382ab4d3fa5fb162a4b2079c9d37711f8d))
* scenario update for latest fix ([9ae82d2](https://github.com/theycantrevealus/nestjs-couchbase/commit/9ae82d2b04ff8fe322b4152e6b965ce1275f2754))


### Features

* add subChildField to get nested model mapping using dot notation ([70ba252](https://github.com/theycantrevealus/nestjs-couchbase/commit/70ba252735729e074664c223e53b37b9a7bc4346))
* model getter and query management ([2a9cc80](https://github.com/theycantrevealus/nestjs-couchbase/commit/2a9cc80721ed8451a65e70ad9ca09681ebea5eca))

# [1.6.0](https://github.com/theycantrevealus/nestjs-couchbase/compare/v1.5.0...v1.6.0) (2025-12-09)


### Features

* test with mocked couchbase library ([76bc002](https://github.com/theycantrevealus/nestjs-couchbase/commit/76bc002f120aa9007b7baac890c255ed6f083551))

# [1.5.0](https://github.com/theycantrevealus/nestjs-couchbase/compare/v1.4.0...v1.5.0) (2025-12-08)


### Features

* split actual test ([16bdc4a](https://github.com/theycantrevealus/nestjs-couchbase/commit/16bdc4af42bd7420deffda636f4ef8690376afb4))

# [1.4.0](https://github.com/theycantrevealus/nestjs-couchbase/compare/v1.3.0...v1.4.0) (2025-12-07)


### Features

* auto create collection and scope on module start ([695283e](https://github.com/theycantrevealus/nestjs-couchbase/commit/695283ed069569fa91851a2d14ab89776578a5ec))
* auto create index from schema property ([d551fa3](https://github.com/theycantrevealus/nestjs-couchbase/commit/d551fa318820ebdd21e42c2658e59fd992ca0b21))

# [1.3.0](https://github.com/theycantrevealus/nestjs-couchbase/compare/v1.2.0...v1.3.0) (2025-12-07)


### Features

* unique field as prop notation and decorator with index manager ([cdde778](https://github.com/theycantrevealus/nestjs-couchbase/commit/cdde7786fec8c0e960284726af12e80d8d7d8f52))

# [1.2.0](https://github.com/theycantrevealus/nestjs-couchbase/compare/v1.1.0...v1.2.0) (2025-12-06)


### Features

* field property required, default, enum, transform, validate ([87a863a](https://github.com/theycantrevealus/nestjs-couchbase/commit/87a863ade6d1074c40aa5c2323bd4a014d31b73f))

# [1.1.0](https://github.com/theycantrevealus/nestjs-couchbase/compare/v1.0.7...v1.1.0) (2025-12-06)


### Features

* add nested type feature for field prop ([e4c596c](https://github.com/theycantrevealus/nestjs-couchbase/commit/e4c596c1d32500be37e0bd80718509e46f22f374))

## [1.0.7](https://github.com/theycantrevealus/nestjs-couchbase/compare/v1.0.6...v1.0.7) (2025-12-06)


### Bug Fixes

* adjust uuid to compat with ESNext type ([71a19d5](https://github.com/theycantrevealus/nestjs-couchbase/commit/71a19d5e5fad76111a044972f6a69321b4d9082f))

## [1.0.6](https://github.com/theycantrevealus/nestjs-couchbase/compare/v1.0.5...v1.0.6) (2025-12-06)


### Bug Fixes

* add uuid override to handle esm issue ([25fabaa](https://github.com/theycantrevealus/nestjs-couchbase/commit/25fabaa03154db57799ab62b81853b85f2e98a2d))

## [1.0.5](https://github.com/theycantrevealus/nestjs-couchbase/compare/v1.0.4...v1.0.5) (2025-12-06)


### Bug Fixes

* add npm ignore file and exclude all packages from src ([0094f8b](https://github.com/theycantrevealus/nestjs-couchbase/commit/0094f8bce18355a4b2334bbbf292bb3531f75acc))
* publish configuration ([7e23ed9](https://github.com/theycantrevealus/nestjs-couchbase/commit/7e23ed947e56439f91940a22e1c05f393eec3dd7))

## [1.0.4](https://github.com/theycantrevealus/nestjs-couchbase/compare/v1.0.3...v1.0.4) (2025-12-06)


### Bug Fixes

* build config ([d45c7b6](https://github.com/theycantrevealus/nestjs-couchbase/commit/d45c7b66a22ea7e2bc2c074da71e6eb15e7f5d9e))

## [1.0.3](https://github.com/theycantrevealus/nestjs-couchbase/compare/v1.0.2...v1.0.3) (2025-12-06)


### Bug Fixes

* configure package publishing status ([78e6cb8](https://github.com/theycantrevealus/nestjs-couchbase/commit/78e6cb857255f7e4036e48d81461d406341beee8))

## [1.0.2](https://github.com/theycantrevealus/nestjs-couchbase/compare/v1.0.1...v1.0.2) (2025-12-06)


### Bug Fixes

* add nest deps ([7c5f0b1](https://github.com/theycantrevealus/nestjs-couchbase/commit/7c5f0b18ef71c348d76ce833d5f67a7e7446e73b))

## [1.0.1](https://github.com/theycantrevealus/nestjs-couchbase/compare/v1.0.0...v1.0.1) (2025-12-06)


### Bug Fixes

* disable turbo on build ([d3e76e5](https://github.com/theycantrevealus/nestjs-couchbase/commit/d3e76e5e57177c2971dde49af590f8a965ee9ca2))

# 1.0.0 (2025-12-06)


### Features

* add npm release flow ([ba443b1](https://github.com/theycantrevealus/nestjs-couchbase/commit/ba443b12c3a7d46b3cb72dc033a927cee0e557b9))
