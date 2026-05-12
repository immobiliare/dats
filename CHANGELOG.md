# [6.0.0](https://github.com/immobiliare/dats/compare/v5.1.1...v6.0.0) (2026-05-12)


* chore!: replace eslint/prettier/husky/ava/nyc with biome/lefthook ([01b3bb7](https://github.com/immobiliare/dats/commit/01b3bb7120062b8151b29ff722279b6f096e3b73))
* feat!: ship ESM-only package, require Node.js >=24, upgrade to TypeScript 6 ([df4e1ca](https://github.com/immobiliare/dats/commit/df4e1ca6418efe8147ec8d090f6547b2686d96e4))


### Bug Fixes

* adds missing build step ([3b8f798](https://github.com/immobiliare/dats/commit/3b8f79835b234082d5913576f20ca44ae1959676))
* **cli:** replace DRY_RUN=1 hint with --dry-run and suppress sent log on dry-run ([429023e](https://github.com/immobiliare/dats/commit/429023e96b2156480756f0d7c51d32513ab862ad))
* coerce port flag value to number before validation ([39a5ede](https://github.com/immobiliare/dats/commit/39a5ede41ea42f5460ef42eef4764c9745146699))
* destructure dry-run key correctly so --dry-run flag activates ([1978d6f](https://github.com/immobiliare/dats/commit/1978d6fbab407b929880f2a4947eef3d53e12fb3))
* ensure CLI args take precedence over file configs ([c92264e](https://github.com/immobiliare/dats/commit/c92264ee66e6401231b92a72c537fd58fd98c72d))
* flush buffered metrics before closing socket ([358f139](https://github.com/immobiliare/dats/commit/358f139c2a191789a417eb69b33850742bf2f5ed))
* **socket:** set closing flag before await to prevent double-close TOCTOU ([92a0d5e](https://github.com/immobiliare/dats/commit/92a0d5eb739cf9daf695d4c4d2083c25e6fae7c2))
* **socket:** set connected flag before awaits to prevent TOCTOU race in close ([e6a0f02](https://github.com/immobiliare/dats/commit/e6a0f02f929c4f950bb90d82a3f189996a33d07f))
* **test:** guard ServerTCP.stop() against double invocation ([1bcb6f4](https://github.com/immobiliare/dats/commit/1bcb6f4bde882583efbbcce52ffcf2aab0b31e9f))
* **test:** guard ServerTCP.stop() against uninitialized or non-listening server ([88e97e6](https://github.com/immobiliare/dats/commit/88e97e65d52ea4fad969395be215d34a14f68370))
* upgrade autocannon from 7.14.0 to 7.15.0 ([e8c1672](https://github.com/immobiliare/dats/commit/e8c1672d8cb0343b3ebe2a27bf275e379ce9b832))


### BREAKING CHANGES

* Development toolchain completely replaced. ESLint, Prettier,
Husky, lint-staged, NYC, Ava, pkg, czrc, and commitlint config removed.
Biome (linter+formatter) and lefthook (git hooks) added instead.
* Package is now ESM-only. CommonJS output has been removed.
Node.js >=24.0.0 is now required (leverages native CJS→ESM interoperability).
TypeScript 6 with NodeNext module resolution. CLI binaries now built with
bun build --compile instead of pkg. Also fixes close() not cancelling the
buffer flush timeout, which could cause timer leaks after the client is closed.

# [6.0.0-next.3](https://github.com/immobiliare/dats/compare/v6.0.0-next.2...v6.0.0-next.3) (2026-05-12)


### Bug Fixes

* **cli:** replace DRY_RUN=1 hint with --dry-run and suppress sent log on dry-run ([429023e](https://github.com/immobiliare/dats/commit/429023e96b2156480756f0d7c51d32513ab862ad))
* coerce port flag value to number before validation ([39a5ede](https://github.com/immobiliare/dats/commit/39a5ede41ea42f5460ef42eef4764c9745146699))
* destructure dry-run key correctly so --dry-run flag activates ([1978d6f](https://github.com/immobiliare/dats/commit/1978d6fbab407b929880f2a4947eef3d53e12fb3))
* ensure CLI args take precedence over file configs ([c92264e](https://github.com/immobiliare/dats/commit/c92264ee66e6401231b92a72c537fd58fd98c72d))
* flush buffered metrics before closing socket ([358f139](https://github.com/immobiliare/dats/commit/358f139c2a191789a417eb69b33850742bf2f5ed))
* **socket:** set closing flag before await to prevent double-close TOCTOU ([92a0d5e](https://github.com/immobiliare/dats/commit/92a0d5eb739cf9daf695d4c4d2083c25e6fae7c2))
* **socket:** set connected flag before awaits to prevent TOCTOU race in close ([e6a0f02](https://github.com/immobiliare/dats/commit/e6a0f02f929c4f950bb90d82a3f189996a33d07f))
* **test:** guard ServerTCP.stop() against double invocation ([1bcb6f4](https://github.com/immobiliare/dats/commit/1bcb6f4bde882583efbbcce52ffcf2aab0b31e9f))
* **test:** guard ServerTCP.stop() against uninitialized or non-listening server ([88e97e6](https://github.com/immobiliare/dats/commit/88e97e65d52ea4fad969395be215d34a14f68370))

# [6.0.0-next.2](https://github.com/immobiliare/dats/compare/v6.0.0-next.1...v6.0.0-next.2) (2026-05-08)


### Bug Fixes

* adds missing build step ([3b8f798](https://github.com/immobiliare/dats/commit/3b8f79835b234082d5913576f20ca44ae1959676))

# [6.0.0-next.1](https://github.com/immobiliare/dats/compare/v5.1.1...v6.0.0-next.1) (2026-05-08)


* chore!: replace eslint/prettier/husky/ava/nyc with biome/lefthook ([01b3bb7](https://github.com/immobiliare/dats/commit/01b3bb7120062b8151b29ff722279b6f096e3b73))
* feat!: ship ESM-only package, require Node.js >=24, upgrade to TypeScript 6 ([df4e1ca](https://github.com/immobiliare/dats/commit/df4e1ca6418efe8147ec8d090f6547b2686d96e4))


### BREAKING CHANGES

* Development toolchain completely replaced. ESLint, Prettier,
Husky, lint-staged, NYC, Ava, pkg, czrc, and commitlint config removed.
Biome (linter+formatter) and lefthook (git hooks) added instead.
* Package is now ESM-only. CommonJS output has been removed.
Node.js >=24.0.0 is now required (leverages native CJS→ESM interoperability).
TypeScript 6 with NodeNext module resolution. CLI binaries now built with
bun build --compile instead of pkg. Also fixes close() not cancelling the
buffer flush timeout, which could cause timer leaks after the client is closed.

## [5.1.1](https://github.com/immobiliare/dats/compare/v5.1.0...v5.1.1) (2025-04-28)

### Bug Fixes

-   add safaguard timeout to idle event ([0f23654](https://github.com/immobiliare/dats/commit/0f23654e27304f71557c0d32e6c3b9cdd640d84f))
-   align tcp and udp sockets ([0e2cde7](https://github.com/immobiliare/dats/commit/0e2cde7c4747b94766a536e6a7e65ddf52a3659f))
-   ensure udp messages are sent on close ([dbe88c6](https://github.com/immobiliare/dats/commit/dbe88c66b6ddc133c15a2fa5d3d7d5b0d10e33f8))

## [5.1.1-next.1](https://github.com/immobiliare/dats/compare/v5.1.0...v5.1.1-next.1) (2025-04-08)

### Bug Fixes

-   align tcp and udp sockets ([0e2cde7](https://github.com/immobiliare/dats/commit/0e2cde7c4747b94766a536e6a7e65ddf52a3659f))
-   ensure udp messages are sent on close ([dbe88c6](https://github.com/immobiliare/dats/commit/dbe88c66b6ddc133c15a2fa5d3d7d5b0d10e33f8))

# [5.1.0](https://github.com/immobiliare/dats/compare/v5.0.2...v5.1.0) (2024-05-21)

### Bug Fixes

-   commitlint ([2fac4aa](https://github.com/immobiliare/dats/commit/2fac4aa7bfe7b9363c3c897aa145c62f256c098a))
-   upgrade autocannon from 7.12.0 to 7.14.0 ([3d07078](https://github.com/immobiliare/dats/commit/3d070780567f8206e34ec266b93d652c60bc9da5))

### Features

-   **client:** add support for tags ([3c6a0de](https://github.com/immobiliare/dats/commit/3c6a0de0eaf216020182eb54b2961d3106f888cd))
-   **client:** move tag serialization into constructor ([d1f4915](https://github.com/immobiliare/dats/commit/d1f4915631d3bb475f11108423baafc89ddbc24e))
-   **client:** support simple tags ([8a753ff](https://github.com/immobiliare/dats/commit/8a753ff717790397d48cbb2bc9c79eae48152059))

## [5.0.2](https://github.com/immobiliare/dats/compare/v5.0.1...v5.0.2) (2023-10-26)

### Bug Fixes

-   release more architectures ([3a7f630](https://github.com/immobiliare/dats/commit/3a7f630efaa06b2ef16efa5840a590cf13cce26e))

## [5.0.1](https://github.com/immobiliare/dats/compare/v5.0.0...v5.0.1) (2023-10-03)

### Bug Fixes

-   **cli:** added missing shebang ([57b2762](https://github.com/immobiliare/dats/commit/57b27626c046956e461fdf2cd5f7618d102e8fe4))
-   upgrade autocannon from 7.10.0 to 7.11.0 ([01b4d9d](https://github.com/immobiliare/dats/commit/01b4d9dd58275a2cb140429e5cf2e0c52ca8bac0))
-   upgrade autocannon from 7.11.0 to 7.12.0 ([48931ca](https://github.com/immobiliare/dats/commit/48931ca765a045974a029598edb8dbbf45cba693))

# [5.0.0](https://github.com/immobiliare/dats/compare/v4.1.0...v5.0.0) (2023-03-22)

### Bug Fixes

-   build remove .exe ([ef65194](https://github.com/immobiliare/dats/commit/ef6519463df5b0a6824cca3fb7e8ebdaf4099c7f))
-   **hostname:** fixed sanitize hostnames with multiple dots. ([4b3fa20](https://github.com/immobiliare/dats/commit/4b3fa20b1bf4bf797f637b9e0963346ecf7f1c9f))

### BREAKING CHANGES

-   **hostname:** Now the Namespacing with Hostname feature 'myGrafanaNamespace.${hostname}' replace all the dots with `_`: now 'myGrafanaNamespace.custom_host_net', before
    'myGrafanaNamespace.custom_host.net'

# [4.1.0](https://github.com/immobiliare/dats/compare/v4.0.0...v4.1.0) (2023-02-13)

### Features

-   **cli:** adds alpine distro ([b9c1252](https://github.com/immobiliare/dats/commit/b9c125229ed0d6942234954bfc03f47a20054dbc))

# [4.0.0](https://github.com/immobiliare/dats/compare/v3.0.1...v4.0.0) (2023-02-08)

### Bug Fixes

-   --dry-run correct casing ([5de9798](https://github.com/immobiliare/dats/commit/5de9798cf67919f05af531e0b1c1ddddd903d51a))
-   invalid namespace when using prefix ([517309f](https://github.com/immobiliare/dats/commit/517309f47c8caa0a26b2cfcc8fb7e9b7de7ed1f6))
-   upgrade autocannon from 7.9.0 to 7.10.0 ([5a4df5e](https://github.com/immobiliare/dats/commit/5a4df5e6550febd35718309f943ce5c25ee44509))

### Features

-   .datsrc config file ([38588aa](https://github.com/immobiliare/dats/commit/38588aafdc70fb0b3000bf8c4894f134b8f22eaf))
-   pin node lts ([31b1cfe](https://github.com/immobiliare/dats/commit/31b1cfe389889ce2fc8317e7215f6e6211215af9))
-   use as a cli ([12d45bb](https://github.com/immobiliare/dats/commit/12d45bbe42635f8c929a5baa7998ec711394a165))

### BREAKING CHANGES

-   Engine set to Node.js 18, the package may work with
    older version tho

# [4.0.0-next.3](https://github.com/immobiliare/dats/compare/v4.0.0-next.2...v4.0.0-next.3) (2023-01-31)

### Bug Fixes

-   --dry-run correct casing ([5de9798](https://github.com/immobiliare/dats/commit/5de9798cf67919f05af531e0b1c1ddddd903d51a))

# [4.0.0-next.2](https://github.com/immobiliare/dats/compare/v4.0.0-next.1...v4.0.0-next.2) (2023-01-31)

### Bug Fixes

-   invalid namespace when using prefix ([517309f](https://github.com/immobiliare/dats/commit/517309f47c8caa0a26b2cfcc8fb7e9b7de7ed1f6))

# [4.0.0-next.1](https://github.com/immobiliare/dats/compare/v3.0.1...v4.0.0-next.1) (2023-01-30)

### Bug Fixes

-   upgrade autocannon from 7.9.0 to 7.10.0 ([5a4df5e](https://github.com/immobiliare/dats/commit/5a4df5e6550febd35718309f943ce5c25ee44509))

### Features

-   .datsrc config file ([38588aa](https://github.com/immobiliare/dats/commit/38588aafdc70fb0b3000bf8c4894f134b8f22eaf))
-   pin node lts ([31b1cfe](https://github.com/immobiliare/dats/commit/31b1cfe389889ce2fc8317e7215f6e6211215af9))
-   use as a cli ([12d45bb](https://github.com/immobiliare/dats/commit/12d45bbe42635f8c929a5baa7998ec711394a165))

### BREAKING CHANGES

-   Engine set to Node.js 18, the package may work with
    older version tho

## [3.0.1](https://github.com/immobiliare/dats/compare/v3.0.0...v3.0.1) (2022-06-06)

### Bug Fixes

-   upgrade autocannon from 7.8.1 to 7.9.0 ([3fd43bf](https://github.com/immobiliare/dats/commit/3fd43bf3c99ed9d5ac4743093d7cbaf086c8ccdc))

# [3.0.0](https://github.com/immobiliare/dats/compare/v2.1.0...v3.0.0) (2022-05-12)

### Bug Fixes

-   upgrade autocannon from 7.6.0 to 7.7.0 ([9cbce14](https://github.com/immobiliare/dats/commit/9cbce14dc611eb7cc6c8066975a6f71a4de92471))
-   upgrade autocannon from 7.7.0 to 7.7.2 ([0392586](https://github.com/immobiliare/dats/commit/0392586597bfb18d8348ec727c37c5757d427b52))
-   upgrade autocannon from 7.7.2 to 7.8.0 ([d2abc9e](https://github.com/immobiliare/dats/commit/d2abc9e26f2e38d8d39dda39639fff24d750c25b))
-   upgrade autocannon from 7.8.0 to 7.8.1 ([f47f1fa](https://github.com/immobiliare/dats/commit/f47f1fac15d1c8398bfa553b04858224e37feec7))

### Features

-   updates node.js ([4a774d2](https://github.com/immobiliare/dats/commit/4a774d2a5eb6e549876d262680549b0f4f46b050))

### BREAKING CHANGES

-   Node.js 12 is deprecated

# [2.1.0](https://github.com/immobiliare/dats/compare/v2.0.0...v2.1.0) (2022-03-07)

### Bug Fixes

-   upgrade autocannon from 7.5.0 to 7.6.0 ([4ea546c](https://github.com/immobiliare/dats/commit/4ea546cc942285cce6210b9ea48aab1e6021d0f0))
-   upgrade concurrently from 6.3.0 to 6.5.1 ([1db1c95](https://github.com/immobiliare/dats/commit/1db1c957456b0ae54022d8b46dc3fe607a54491f))

### Features

-   **mock:** added dats mock ([8f78efe](https://github.com/immobiliare/dats/commit/8f78efef8dcb57409048320a949fb22738668a6a))

# [2.0.0](https://github.com/immobiliare/dats/compare/v1.0.0...v2.0.0) (2022-02-04)

### Bug Fixes

-   remove sampling parameter where is not used ([e3c6012](https://github.com/immobiliare/dats/commit/e3c6012f1db6399e40e3bea6cfa62a927a756127))
-   sanitize hostnames with dots ([23e34ec](https://github.com/immobiliare/dats/commit/23e34ec6f7c4ac93ff3f2f9ecd30a45907b156a6))
-   updates ts-eslint ([2738735](https://github.com/immobiliare/dats/commit/27387352bf37b430ed402914e59e023fbf314355))

### Features

-   freezed getSupportedTypes output ([b08c082](https://github.com/immobiliare/dats/commit/b08c0826f655988212456b27264015f7bc35c9f9))
-   **debug:** switch to nodejs debug mode ([2b0af11](https://github.com/immobiliare/dats/commit/2b0af117d1526793ea8bc9af8a9e1b8ddcfdbcc8))
-   **logo:** adds D logo w/ darkmode support ([225c121](https://github.com/immobiliare/dats/commit/225c12100e3a3c583763f75dcb4602d437f9508a))

### BREAKING CHANGES

-   **debug:** switch to nodejs debug mode

# 1.0.0 (2021-11-05)

### Bug Fixes

-   **publish:** adds access public ([43dc08c](https://github.com/immobiliare/dats/commit/43dc08c74fafbf397cf78445ca84fc1b2067822f))
-   **tests:** fix connection failed tcp test ([77087af](https://github.com/immobiliare/dats/commit/77087afc40b817f45c12be0174a2112740905548))
-   **tests:** fix timeout error on tcp test ([27bfeea](https://github.com/immobiliare/dats/commit/27bfeeac6dfe205d97515d594094b9534057776e))

### Features

-   **git:** added package-lock in .gitignore ([fd90b7a](https://github.com/immobiliare/dats/commit/fd90b7a19f9359fa10b79fb1a10132782c74f50b))
-   added CI ([9354666](https://github.com/immobiliare/dats/commit/935466670f3cc7ecffd51da9207454357a6a2f46))
-   removed package-lock ([896811b](https://github.com/immobiliare/dats/commit/896811ba9aec4d5a9e1695481dad15d3821357d4))
-   upgraded npm to v8 ([4455a14](https://github.com/immobiliare/dats/commit/4455a1468037fc9acdd5e7b0352734603d0b983a))
-   **node:** upgraded node to v16 ([66de297](https://github.com/immobiliare/dats/commit/66de297e396933405ff85585e575c27383779f41))
-   makes onError function optional in the sockets ([533b891](https://github.com/immobiliare/dats/commit/533b891d30ac9d2a8acde3ec8521b0349baa204c))
