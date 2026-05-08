import { AddressInfo } from "net";
import t from "tap";
import Client from "../src/index.ts";
import StatsdMock from "./helpers/server.ts";

let serverUdp6: StatsdMock;
let addressUdp6: AddressInfo;

t.beforeEach(async () => {
  serverUdp6 = new StatsdMock(6);
  addressUdp6 = await serverUdp6.start();
});

t.afterEach(async () => {
  await serverUdp6.stop();
});

t.test("should work udp6", (t) => {
  const host = new URL(`udp6://localhost:${addressUdp6.port}`);
  const namespace = "ns1";
  const client = new Client({ host, namespace });
  return new Promise<void>((resolve) => {
    serverUdp6.on("metric", (metric) => {
      t.equal(metric.toString(), `${namespace}.some.metric:1|c|@10`);
      resolve();
    });
    client.counter("some.metric", 1, 10);
  });
});

t.test("should work udp6 with ip", (t) => {
  const host = new URL(`udp6://[::1]:${addressUdp6.port}`);
  const namespace = "ns1";
  const client = new Client({ host, namespace });
  return new Promise<void>((resolve) => {
    serverUdp6.on("metric", (metric) => {
      t.equal(metric.toString(), `${namespace}.some.metric:1|c|@10`);
      resolve();
    });
    client.counter("some.metric", 1, 10);
  });
});

t.test("should work udp6 with ip without passing udp version", (t) => {
  const host = new URL(`udp://[::1]:${addressUdp6.port}`);
  const namespace = "ns1";
  const client = new Client({ host, namespace });
  return new Promise<void>((resolve) => {
    serverUdp6.on("metric", (metric) => {
      t.equal(metric.toString(), `${namespace}.some.metric:1|c|@10`);
      resolve();
    });
    client.counter("some.metric", 1, 10);
  });
});

t.test(
  "If udp version and ip address mismatch should follow the IP version",
  (t) => {
    const host = new URL(`udp4://[::1]:${addressUdp6.port}`);
    const namespace = "ns1";
    const client = new Client({ host, namespace });
    return new Promise<void>((resolve) => {
      serverUdp6.on("metric", (metric) => {
        t.equal(metric.toString(), `${namespace}.some.metric:1|c|@10`);
        resolve();
      });
      client.counter("some.metric", 1, 10);
    });
  },
);
