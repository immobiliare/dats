## [5.0.2](https://github.com/immobiliare/dats/compare/v5.0.1...v5.0.2) (2023-10-26)


### Bug Fixes

* release more architectures ([3a7f630](https://github.com/immobiliare/dats/commit/3a7f630efaa06b2ef16efa5840a590cf13cce26e))

## [5.0.1](https://github.com/immobiliare/dats/compare/v5.0.0...v5.0.1) (2023-10-03)


### Bug Fixes

* **cli:** added missing shebang ([57b2762](https://github.com/immobiliare/dats/commit/57b27626c046956e461fdf2cd5f7618d102e8fe4))
* upgrade autocannon from 7.10.0 to 7.11.0 ([01b4d9d](https://github.com/immobiliare/dats/commit/01b4d9dd58275a2cb140429e5cf2e0c52ca8bac0))
* upgrade autocannon from 7.11.0 to 7.12.0 ([48931ca](https://github.com/immobiliare/dats/commit/48931ca765a045974a029598edb8dbbf45cba693))

# [5.0.0](https://github.com/immobiliare/dats/compare/v4.1.0...v5.0.0) (2023-03-22)


### Bug Fixes

* build remove .exe ([ef65194](https://github.com/immobiliare/dats/commit/ef6519463df5b0a6824cca3fb7e8ebdaf4099c7f))
* **hostname:** fixed sanitize hostnames with multiple dots. ([4b3fa20](https://github.com/immobiliare/dats/commit/4b3fa20b1bf4bf797f637b9e0963346ecf7f1c9f))


### BREAKING CHANGES

* **hostname:** Now the Namespacing with Hostname feature 'myGrafanaNamespace.${hostname}' replace all the dots with `_`: now 'myGrafanaNamespace.custom_host_net', before
'myGrafanaNamespace.custom_host.net'

# [4.1.0](https://github.com/immobiliare/dats/compare/v4.0.0...v4.1.0) (2023-02-13)


### Features

* **cli:** adds alpine distro ([b9c1252](https://github.com/immobiliare/dats/commit/b9c125229ed0d6942234954bfc03f47a20054dbc))

# [4.0.0](https://github.com/immobiliare/dats/compare/v3.0.1...v4.0.0) (2023-02-08)


### Bug Fixes

* --dry-run correct casing ([5de9798](https://github.com/immobiliare/dats/commit/5de9798cf67919f05af531e0b1c1ddddd903d51a))
* invalid namespace when using prefix ([517309f](https://github.com/immobiliare/dats/commit/517309f47c8caa0a26b2cfcc8fb7e9b7de7ed1f6))
* upgrade autocannon from 7.9.0 to 7.10.0 ([5a4df5e](https://github.com/immobiliare/dats/commit/5a4df5e6550febd35718309f943ce5c25ee44509))


### Features

* .datsrc config file ([38588aa](https://github.com/immobiliare/dats/commit/38588aafdc70fb0b3000bf8c4894f134b8f22eaf))
* pin node lts ([31b1cfe](https://github.com/immobiliare/dats/commit/31b1cfe389889ce2fc8317e7215f6e6211215af9))
* use as a cli ([12d45bb](https://github.com/immobiliare/dats/commit/12d45bbe42635f8c929a5baa7998ec711394a165))


### BREAKING CHANGES

* Engine set to Node.js 18, the package may work with
older version tho

# [4.0.0-next.3](https://github.com/immobiliare/dats/compare/v4.0.0-next.2...v4.0.0-next.3) (2023-01-31)


### Bug Fixes

* --dry-run correct casing ([5de9798](https://github.com/immobiliare/dats/commit/5de9798cf67919f05af531e0b1c1ddddd903d51a))

# [4.0.0-next.2](https://github.com/immobiliare/dats/compare/v4.0.0-next.1...v4.0.0-next.2) (2023-01-31)


### Bug Fixes

* invalid namespace when using prefix ([517309f](https://github.com/immobiliare/dats/commit/517309f47c8caa0a26b2cfcc8fb7e9b7de7ed1f6))

# [4.0.0-next.1](https://github.com/immobiliare/dats/compare/v3.0.1...v4.0.0-next.1) (2023-01-30)


### Bug Fixes

* upgrade autocannon from 7.9.0 to 7.10.0 ([5a4df5e](https://github.com/immobiliare/dats/commit/5a4df5e6550febd35718309f943ce5c25ee44509))


### Features

* .datsrc config file ([38588aa](https://github.com/immobiliare/dats/commit/38588aafdc70fb0b3000bf8c4894f134b8f22eaf))
* pin node lts ([31b1cfe](https://github.com/immobiliare/dats/commit/31b1cfe389889ce2fc8317e7215f6e6211215af9))
* use as a cli ([12d45bb](https://github.com/immobiliare/dats/commit/12d45bbe42635f8c929a5baa7998ec711394a165))


### BREAKING CHANGES

* Engine set to Node.js 18, the package may work with
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
