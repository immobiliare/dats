# Benchmarks

<!-- toc -->

-   [Setup](#setup)
-   [Base](#base)
-   [Dats](#dats)
-   [Dats buffered](#dats-buffered)

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

## Dats

This benchmark tests a server that uses `dats` to send metrics.

```bash
$ npm run bench:dats
```

## Dats buffered

This benchmark tests a server that uses `dats` setup with a buffer to send metrics.

```bash
$ npm run bench:dats_buffered
```
