import t from "tap";
import ClientMock from "../src/mock.ts";

t.test("mock works", async (t) => {
  const host = new URL("udp://127.0.0.1:8232");
  const namespace = "ns1";
  const client = new ClientMock({ host, namespace });
  client.counter("some.metric", 1, 10);
  client.timing("some.metric", 100);
  client.gauge("some.metric", 100);
  client.set("some.metric", 100);
  t.strictSame(client.metrics, [
    "ns1.some.metric:1|c|@10",
    "ns1.some.metric:100|ms",
    "ns1.some.metric:100|g",
    "ns1.some.metric:100|s",
  ]);
});

t.test("mock clean works", async (t) => {
  const host = new URL("udp://127.0.0.1:8232");
  const namespace = "ns1";
  const client = new ClientMock({ host, namespace });

  client.gauge("some.metric", 100);
  client.set("some.metric", 100);
  t.strictSame(client.metrics, [
    "ns1.some.metric:100|g",
    "ns1.some.metric:100|s",
  ]);
  client.cleanMetrics();

  client.counter("some.metric", 1, 10);
  client.timing("some.metric", 100);
  t.strictSame(client.metrics, [
    "ns1.some.metric:1|c|@10",
    "ns1.some.metric:100|ms",
  ]);
});

t.test("mock close works", async (t) => {
  const host = new URL("udp://127.0.0.1:8232");
  const namespace = "ns1";
  const client = new ClientMock({ host, namespace });

  client.gauge("some.metric", 100);
  client.set("some.metric", 100);
  t.strictSame(client.metrics, [
    "ns1.some.metric:100|g",
    "ns1.some.metric:100|s",
  ]);
  client.close();

  client.counter("some.metric", 1, 10);
  client.timing("some.metric", 100);
  t.strictSame(client.metrics, [
    "ns1.some.metric:100|g",
    "ns1.some.metric:100|s",
  ]);
});

t.test("mock hasSent works", async (t) => {
  const host = new URL("udp://127.0.0.1:8232");
  const namespace = "ns1";
  const client = new ClientMock({ host, namespace });

  client.gauge("some.metric", 100);
  client.set("some.metric", 100);
  t.ok(client.hasSent("ns1.some.metric:100|g"));
  t.notOk(client.hasSent("ns1.some.metric:1020|g"));
  t.ok(client.hasSent(/ns1\.some\.metric:\d+\|g/));
  t.notOk(client.hasSent(/ns1\.some\.metric:\d+\|yt/));
});
