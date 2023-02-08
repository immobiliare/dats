<p align="center"><img src="./logo.svg?sanitize=true" alt="logo" width="200px" /></p>

<h1 align="center">dats</h1>

[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier?style=flat-square)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg?style=flat-square)](https://github.com/semantic-release/semantic-release)
![npm (scoped)](https://img.shields.io/npm/v/@immobiliarelabs/dats?style=flat-square)
![license](https://img.shields.io/github/license/immobiliare/dats)

> Minimalistic zero-dependencies UDP/TCP [statsd](https://github.com/statsd/statsd) client for Node.js

There are times when you have to gather metrics and you want something simple without writing too much boilerplate, `dats` to your aid!

This client aims to have a simple [statsd](https://github.com/statsd/statsd) compliant API with some optional flavour for advanced usage, like: buffered metrics and either UDP/TCP transports!

Supports Node.js `>=14.0.0`, if you are a Node.js `v12` user refer to `dats@2.x.x`.

## Table of Content

<!-- toc -->

- [Installation](#installation)
- [Usage](#usage)
  * [Generic](#generic)
  * [Namespacing with Hostname/PID](#namespacing-with-hostnamepid)
  * [TCP Client](#tcp-client)
- [API](#api)
  * [`Client`](#client)
    + [`new Client(options)`](#new-clientoptions)
    + [`Client.close([cb])`](#clientclosecb)
    + [`Client.connect()`](#clientconnect)
    + [`Client.counter(string[, value, sampling])`](#clientcounterstring-value-sampling)
    + [`Client.timing(string, value[, sampling])`](#clienttimingstring-value-sampling)
    + [`Client.gauge(string, value)`](#clientgaugestring-value)
    + [`Client.set(string, value)`](#clientsetstring-value)
- [Dats Mock](#dats-mock)
- [CLI Interface](#cli-interface)
  * [CLI Usage](#cli-usage)
  * [Pre-compiled binary](#pre-compiled-binary)
- [Benchmarks](#benchmarks)
- [Powered Apps](#powered-apps)
- [Support & Contribute](#support--contribute)
- [License](#license)

<!-- tocstop -->

## Installation

The package is available at [npm](https://www.npmjs.com/package/@immobiliarelabs/dats).

You can install it with `npm`

```bash
# lastest stable version
$ npm i -S @immobiliarelabs/dats
# latest development version
$ npm i -S @immobiliarelabs/dats@next
```

or `yarn`

```bash
# lastest stable version
$ yarn add @immobiliarelabs/dats
# latest development version
$ yarn @immobiliarelabs/dats@next
```

## Usage

### Generic

```ts
import Client from '@immobiliarelabs/dats';

const stats = new Client({
    host: 'udp://someip:someport',
    namespace: 'myGrafanaNamespace',
    // Optionally register a global handler to track errors.
    onError: (error) => {
        processError(error);
    },
});

// Send counter (myGrafanaNamespace.some.toCount)
stats.counter('some.toCount', 3);
stats.counter('some.toCount'); // defaults to 1
stats.counter('some.toCount', 1, 10); // set sampling to 10
// Send timing (myGrafanaNamespace.some.toTime)
stats.timing('some.toTime', 10);
stats.timing('some.toTime', 10, 0.1); // set sampling to 0.1

// Send gauge (myGrafanaNamespace.some.toGauge)
stats.gauge('some.toGauge', 23);

// Send set (myGrafanaNamespace.some.set)
stats.set('some.set', 765);
```

### Namespacing with Hostname/PID

```ts
// Scope your stats per hostname and/or pid
import Client from '@immobiliarelabs/dats';

const stats = new Client({
    host: 'udp://someip:someport',
    namespace: 'myGrafanaNamespace.${hostname}.${pid}',
});

// Send counter (myGrafanaNamespace.myMachine.123.some.toCount)
stats.counter('some.toCount', 3);
```

If the hostname contains any `.`, the client will replace them with `_`.

### TCP Client

```ts
import Client from '@immobiliarelabs/dats';

// TCP usage
const stats = new Client({
    host: 'tcp://someip:someport',
    namespace: 'myGrafanaNamespace.${hostname}.${pid}',
});

// Calling connect is required in TCP environment
await stats.connect();

// Send counter (myGrafanaNamespace.myMachine.123.some.toCount)
stats.counter('some.toCount', 3);
```

## API

This module exports:

-   [`Client`](#client)

### `Client`

> The statsd client

#### `new Client(options)`

-   `options`: configuration object.
    -   `host`: statsd host (`udp://{ip}:{port}` or `tcp://{ip}:{port}`), you can use also ipv6. If you want to force udp6 usage use: `udp6://{host}:{port}`, when using TCP, you have to call the [`Client.connect`](#clientconnect) method.
    -   `namespace`: Optional. Prefix to use for the metrics. The metric will be sent as `namespace.` + the metric string. Optionally you can use `${hostname}` and `${pid}` placeholders in the namespace and have them substituted with the machine hostname and the process id.
    -   `bufferSize`: Optional. Default is `0`. Setting this value to a number greather than zero will activate buffered mode, which instead of sending metrics on each call, it will buffer them and send them when one of this conditions occurs: the buffer is full, or the `bufferFlushTimeout` has expired. Using this approach is more performant, but you must be careful to use a value compatible to the MTU available on your network, otherwise your packets might get dropped silently. See [multi-metric-packets](https://github.com/statsd/statsd/blob/v0.8.6/docs/metric_types.md#multi-metric-packets).
    -   `bufferFlushTimeout`: Optional. Default is `100`. Timeout in milliseconds to wait before flushing the metrics buffer.
    -   `debug`: Optional. Default `debuglog('dats')`. The logger function.
    -   `udpDnsCache`: Optional. Default true. Activate the cache DNS lookup for udp.
    -   `udpDnsCacheTTL`: Optional. Default `120`. Dns cache Time to live in seconds.
    -   `onError`: Optional. Default `(err) => void`. Called when there is an error. Allows you to check also send errors.
    -   `customSocket`: Optional. Default `null`. Custom socket used by the client, this is a feature for mocking we do not recommend using it in production.

#### `Client.close([cb])`

> close the client socket

-   `cb`: optional. A callback function to call when the socket is closed. If no `cb` is provided a `Promise` is returned.

**Returns**: a `Promise` if no `cb` is passed.

#### `Client.connect()`

> connect the TCP socket. Calling this function is required only on TCP.

**Returns**: a `Promise`.

#### `Client.counter(string[, value, sampling])`

> send a metric of type counter

-   `string`: The metric string
-   `value`: Optional. The metric value (`Number`). Defaults to `1`.
-   `sampling`: Optional. The metric sampling.

All sending errors are handled by the `onError` callback.

#### `Client.timing(string, value[, sampling])`

> send a metric of type timing

-   `string`: The metric string
-   `value`: The metric value (`Number`).
-   `sampling`: Optional. The metric sampling.

All sending errors are handled by the `onError` callback.

#### `Client.gauge(string, value)`

> send a metric of type gauge

-   `string`: The metric string
-   `value`: The metric value (`Number`).

All sending errors are handled by the `onError` callback.

#### `Client.set(string, value)`

> send a metric of type set

-   `string`: The metric string
-   `value`: The metric value (`Number`).

All sending errors are handled by the `onError` callback.

## Dats Mock

Dats exports his mock, you can use it as follow:

```ts
import ClientMock from '@immobiliarelabs/dats/dist/mock';

const host = new URL(`udp://127.0.0.1:8232`);
const namespace = 'ns1';
const client = new ClientMock({ host, namespace });

client.gauge('some.metric', 100);
client.set('some.metric', 100);
// metrics is an array with all metrics sent
console.log(client.metrics);
/* stdout:
    [
        'ns1.some.metric:100|g',
        'ns1.some.metric:100|s',
    ]
*/
// Check if a metric is in the metrics array
client.hasSent('ns1.some.metric:100|s'); // -> true
client.hasSent('ns1.some.metric:10|s'); // -> false
client.hasSent(/ns1\.some\.metric:\d+\|s/); // -> true
client.hasSent(/ns1\.some\.test:\d+\|s/); // -> false

// Clean the metrics array with
client.cleanMetrics();
console.log(client.metrics);
/* stdout:
    []
*/
```

## CLI Interface

dats is also exposed as a CLI that can both be installed as a npm global package or a precompiled binary.

The precompile binary can be found in the [release section](https://github.com/immobiliare/dats/releases) for Linux, MacOS or Windows.

### CLI Usage

```sh
$ npm i -g @immobiliarelabs/dats
dats --help
# ℹ️  The following are required input flags:
#
#         --host {string} []
#         --port {string} []
#         --type {string} [Metric type can be one of: counter, timing, gauge, set]
#         --prefix {string} [Metric prefix]
#         --namespace {string} [Metric full namespace, use dots `.` to separate metrics]
#         --value {string} [Metric value]
#         --quiet {boolean} [Suppress all console output]
#         --dryRun {boolean} [Metric wont be sent, use for debug]
#
# If unsure of output run the command prepended with `DRY_RUN=1`
```

### Pre-compiled binary

If you want to use the precompiled binary get the correct link for your OS in the [release section](https://github.com/immobiliare/dats/releases) and do the following:

```bash
curl https://github.com/immobiliare/dats/releases/download/v{{VERSION_TAG}}/dats-cli-{{VERSION_OS}} -L -o dats-cli
chmod +x dats-cli
./dats-cli
```

## Benchmarks

The automatic benchmarking for every commit can be found at the following links: [next](https://immobiliare.github.io/dats/next/bench/index.html) and
[main](https://immobiliare.github.io/dats/main/bench/index.html).

The tests were done using [autocannon](https://github.com/mcollina/autocannon) pointing to an HTTP node.js Server that sends at each request a count metric.
With this kind of test, we evaluate how much the library influences the application performance.

Below are reported the benchmarks with the most famous node.js statsd clients:

| LIBRARY                                                      | Req/Sec (97.5th) | Req/Sec (avg) |
| ------------------------------------------------------------ | ---------------- | ------------- |
| [dats](https://github.com/immobiliare/dats)                  | 45503            | 43174.4       |
| [hot-shots](https://github.com/brightcove/hot-shots)         | 46975            | 43319.47      |
| [node-statsd](https://github.com/sivy/node-statsd)           | 14935            | 11632.34      |
| [statsd-client](https://www.npmjs.com/package/statsd-client) | 42463            | 35790.67      |
|                                                              |                  |               |
| Base                                                         | 50271            | 43312.54      |

**Base** is the HTTP server without metrics.

## Powered Apps

dats was created by the amazing Node.js team at ImmobiliareLabs, the Tech dept of [Immobiliare.it](https://www.immobiliare.it), the #1 real estate company in Italy.

We are currently using dats in our products as well as our internal toolings.

**If you are using dats in production [drop us a message](mailto:opensource@immobiliare.it)**.

## Support & Contribute

Made with ❤️ by [ImmobiliareLabs](https://github.com/immobiliare) & [Contributors](./CONTRIBUTING.md#contributors)

We'd love for you to contribute to dats!
If you have any questions on how to use dats, bugs and enhancement please feel free to reach out by opening a [GitHub Issue](https://github.com/immobiliare/dats/issues).

## License

dats is licensed under the MIT license.  
See the [LICENSE](./LICENSE) file for more information.
