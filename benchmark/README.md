# Benchmarks

<!-- toc -->

-   [Setup](#setup)
-   [Base](#base)
-   [dats](#dats)
-   [dats buffered](#dats-buffered)

<!-- tocstop -->

## Setup

```bash
cd benchmark
npm i
```

## Base

This benchmark tests a barebone http server.

```bash
$ npm run bench:base
```

## dats

This benchmark tests a server that uses `dats` to send metrics.

```bash
$ npm run bench:dats
```

## dats buffered

This benchmark tests a server that uses `dats` setup with a buffer to send metrics.

```bash
$ npm run bench:dats_buffered
```
