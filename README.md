[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)

# dats

> Minimalistic zero-dependencies [statsd](https://github.com/statsd/statsd) client for Node.js

<!-- toc -->

-   [Installation](#installation)
-   [Usage](#usage)
    -   [Generic](#generic)
    -   [Namespacing with Hostname/PID](#namespacing-with-hostnamepid)
    -   [TCP Client](#tcp-client)
-   [API](#api)
    -   [`Client`](#client)
        -   [`new Client(options)`](#new-clientoptions)
        -   [`Client#close([cb])`](#client%23closecb)
        -   [`Client#connect()`](#client%23connect)
        -   [`Client#counter(string[, value, sampling])`](#client%23counterstring-value-sampling)
        -   [`Client#timing(string, value[, sampling])`](#client%23timingstring-value-sampling)
        -   [`Client#gauge(string, value)`](#client%23gaugestring-value)
        -   [`Client#set(string, value)`](#client%23setstring-value)
-   [Benchmarks](#benchmarks)
-   [Contributing](#contributing)

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
    -   `host`: statsd host (udp://someip:port or tcp://someip:port), you can use also ipv6. If you want to force udp6 usage use: `udp6://hostname:port`, when using TCP, you have to call the [`Client#connect`](#Client#connect) method.
    -   `namespace`: Optional. Prefix to use for the metrics. The metric will be sent as `namespace.` + the metric string. Optionally you can use `${hostname}` and `${pid}` placeholders in the namespace and have them substituted with the machine hostname and the process id.
    -   `bufferSize`: Optional. Default is `0`. Setting this value to a number greather than zero will activate buffered mode, which instead of sending metrics on each call, it will buffer them and send them when one of this conditions occurs: the buffer is full, or the `bufferFlushTimeout` has expired. Using this approach is more performant, but you must be careful to use a value compatible to the MTU available on your network, otherwise your packets might get dropped silently. See https://github.com/statsd/statsd/blob/v0.8.6/docs/metric_types.md#multi-metric-packets.
    -   `bufferFlushTimeout`: Optional. Default is `100`. Timeout in milliseconds to wait before flushing the metrics buffer.
    -   `debug`: Optional. Default `null`. The logger function.
    -   `udpDnsCache`: Optional. Default true. Activate the cache DNS lookup for udp.
    -   `udpDnsCacheTTL`: Optional. Default `120`. Dns cache Time to live in seconds.
    -   `onError`: Optional. Default `(err) => void`. Called when there is an error. Allows you to check also send errors.

#### `Client#close([cb])`

> close the client socket

-   `cb`: optional. A callback function to call when the socket is closed. If no `cb` is provided a `Promise` is returned.

**Returns**: a `Promise` if no `cb` is passed.

#### `Client#connect()`

> connect the TCP socket. Calling this function is required only on TCP.

**Returns**: a `Promise`.

#### `Client#counter(string[, value, sampling])`

> send a metric of type counter

-   `string`: The metric string
-   `value`: Optional. The metric value (`Number`). Defaults to `1`.
-   `sampling`: Optional. The metric sampling.

All sending errors are handled by the `onError` callback.

#### `Client#timing(string, value[, sampling])`

> send a metric of type timing

-   `string`: The metric string
-   `value`: The metric value (`Number`).
-   `sampling`: Optional. The metric sampling.

All sending errors are handled by the `onError` callback.

#### `Client#gauge(string, value)`

> send a metric of type gauge

-   `string`: The metric string
-   `value`: The metric value (`Number`).

All sending errors are handled by the `onError` callback.

#### `Client#set(string, value)`

> send a metric of type set

-   `string`: The metric string
-   `value`: The metric value (`Number`).

All sending errors are handled by the `onError` callback.

## Benchmarks

The tests were done using autocannon pointing to an HTTP node.js Server that sends at each request a count metric.
With this kind of test, we evaluate how much the library influences the application performance.

Below are reported the benchmarks with the most famous node.js statsd clients:

| LIBRARY       | Req/Sec (97.5%) | Req/Sec (avg) |
| ------------- | --------------- | ------------- |
| Dats          | 45503           | 43174.4       |
| Hot-shots     | 46975           | 43319.47      |
| Node-statsd   | 14935           | 11632.34      |
| statsd-client | 42463           | 35790.67      |
|               |                 |               |
| Base          | 50271           | 43312.54      |

**Base** is the HTTP server without metrics.

## Contributing

See [the contributing section](./CONTRIBUTING.md).
