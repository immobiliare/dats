import { lookup } from "dns";
import { AddressInfo } from "net";
import os from "os";
import sinon from "sinon";
import t from "tap";
import { promisify } from "util";
import buildLookupFunction from "../src/dns-cache.ts";
import Client from "../src/index.ts";
import { SocketUdp } from "../src/socket.ts";
import StatsdMock from "./helpers/server.ts";

const sleep = promisify(setTimeout);

let server: StatsdMock;
let address: AddressInfo;

t.beforeEach(async () => {
  server = new StatsdMock();
  address = await server.start();
});

t.afterEach(async () => {
  await server.stop();
});

t.test("should throw an error with invalid options", async (t) => {
  const list: Array<[unknown, string]> = [
    [{ namespace: "ns" }, "A host is required"],
    [
      { host: "udp://127.0.0.1:123", namespace: 123 },
      "A namespace string is required",
    ],
    [{ host: "udp://127.0.0.1", namespace: "ns" }, "A port is required"],
    [undefined, "A host is required"],
    [{ bufferSize: -1 }, "bufferSize must be a number >= 0"],
    [{ bufferFlushTimeout: -1 }, "bufferFlushTimeout must be a number > 0"],
  ];

  for (const [opts, message] of list) {
    t.throws(() => new Client(opts as never), { message });
  }
});

t.test(
  "should clean the namespace string from dots at the beginning",
  async (t) => {
    const list = [
      { in: "...s.a.b", out: "s.a.b." },
      { in: ".s.a.b", out: "s.a.b." },
      { in: "s.a.b", out: "s.a.b." },
    ];

    for (const item of list) {
      const client = new Client({
        namespace: item.in,
        host: "udp://127.0.0.1:123",
      });
      t.equal((client as never as Record<string, string>).namespace, item.out);
    }
  },
);

t.test("counter", (t) => {
  const host = new URL(`udp://127.0.0.1:${address.port}`);
  const namespace = "ns1";
  const client = new Client({ host, namespace });
  return new Promise<void>((resolve) => {
    server.on("metric", (metric) => {
      t.equal(metric.toString(), `${namespace}.some.metric:1|c`);
      resolve();
    });
    client.counter("some.metric");
  });
});

t.test("counter with sampling", (t) => {
  const host = new URL(`udp://127.0.0.1:${address.port}`);
  const namespace = "ns1";
  const client = new Client({ host, namespace });
  return new Promise<void>((resolve) => {
    server.on("metric", (metric) => {
      t.equal(metric.toString(), `${namespace}.some.metric:1|c|@10`);
      resolve();
    });
    client.counter("some.metric", 1, 10);
  });
});

t.test("counter with tags", (t) => {
  const host = new URL(`udp://127.0.0.1:${address.port}`);
  const namespace = "ns1";
  const tags = { tag1: "value1", tag2: null, tag3: "value3" };
  const client = new Client({ host, namespace, tags });
  return new Promise<void>((resolve) => {
    server.on("metric", (metric) => {
      t.equal(
        metric.toString(),
        `${namespace}.some.metric:1|c|@10|#tag1:value1,tag2,tag3:value3`,
      );
      resolve();
    });
    client.counter("some.metric", 1, 10);
  });
});

t.test("timing", (t) => {
  const host = new URL(`udp://127.0.0.1:${address.port}`);
  const namespace = "ns1";
  const client = new Client({ host, namespace });
  return new Promise<void>((resolve) => {
    server.on("metric", (metric) => {
      t.equal(metric.toString(), `${namespace}.some.metric:1|ms`);
      resolve();
    });
    client.timing("some.metric", 1);
  });
});

t.test("timing with sampling", (t) => {
  const host = new URL(`udp://127.0.0.1:${address.port}`);
  const namespace = "ns1";
  const client = new Client({ host, namespace });
  return new Promise<void>((resolve) => {
    server.on("metric", (metric) => {
      t.equal(metric.toString(), `${namespace}.some.metric:1|ms|@10`);
      resolve();
    });
    client.timing("some.metric", 1, 10);
  });
});

t.test("timing with tags", (t) => {
  const host = new URL(`udp://127.0.0.1:${address.port}`);
  const namespace = "ns1";
  const tags = { tag1: "value1", tag2: null, tag3: "value3" };
  const client = new Client({ host, namespace, tags });
  return new Promise<void>((resolve) => {
    server.on("metric", (metric) => {
      t.equal(
        metric.toString(),
        `${namespace}.some.metric:1|ms|@10|#tag1:value1,tag2,tag3:value3`,
      );
      resolve();
    });
    client.timing("some.metric", 1, 10);
  });
});

t.test("gauge", (t) => {
  const host = new URL(`udp://127.0.0.1:${address.port}`);
  const namespace = "ns1";
  const client = new Client({ host, namespace });
  return new Promise<void>((resolve) => {
    server.on("metric", (metric) => {
      t.equal(metric.toString(), `${namespace}.some.metric:1|g`);
      resolve();
    });
    client.gauge("some.metric", 1);
  });
});

t.test("gauge should ignore sampling", (t) => {
  const host = new URL(`udp://127.0.0.1:${address.port}`);
  const namespace = "ns1";
  const client = new Client({ host, namespace });
  return new Promise<void>((resolve) => {
    server.on("metric", (metric) => {
      t.equal(metric.toString(), `${namespace}.some.metric:1|g`);
      resolve();
    });
    client.gauge("some.metric", 1);
  });
});

t.test("gauge with tags", (t) => {
  const host = new URL(`udp://127.0.0.1:${address.port}`);
  const namespace = "ns1";
  const tags = { tag1: "value1", tag2: null, tag3: "value3" };
  const client = new Client({ host, namespace, tags });
  return new Promise<void>((resolve) => {
    server.on("metric", (metric) => {
      t.equal(
        metric.toString(),
        `${namespace}.some.metric:1|g|#tag1:value1,tag2,tag3:value3`,
      );
      resolve();
    });
    client.gauge("some.metric", 1);
  });
});

t.test("set", (t) => {
  const host = new URL(`udp://127.0.0.1:${address.port}`);
  const namespace = "ns1";
  const client = new Client({ host, namespace });
  return new Promise<void>((resolve) => {
    server.on("metric", (metric) => {
      t.equal(metric.toString(), `${namespace}.some.metric:1|s`);
      resolve();
    });
    client.set("some.metric", 1);
  });
});

t.test("set should ignore sampling", (t) => {
  const host = new URL(`udp://127.0.0.1:${address.port}`);
  const namespace = "ns1";
  const client = new Client({ host, namespace });
  return new Promise<void>((resolve) => {
    server.on("metric", (metric) => {
      t.equal(metric.toString(), `${namespace}.some.metric:1|s`);
      resolve();
    });
    client.set("some.metric", 1);
  });
});

t.test("set with tags", (t) => {
  const host = new URL(`udp://127.0.0.1:${address.port}`);
  const namespace = "ns1";
  const tags = { tag1: "value1", tag2: null, tag3: "value3" };
  const client = new Client({ host, namespace, tags });
  return new Promise<void>((resolve) => {
    server.on("metric", (metric) => {
      t.equal(
        metric.toString(),
        `${namespace}.some.metric:1|s|#tag1:value1,tag2,tag3:value3`,
      );
      resolve();
    });
    client.set("some.metric", 1);
  });
});

t.test("hostname substitution", (t) => {
  const host = new URL(`udp://127.0.0.1:${address.port}`);
  const namespace = "ns1.${hostname}";
  const hostnameStub = sinon.stub(os, "hostname").returns("some-host");
  const client = new Client({ host, namespace });
  return new Promise<void>((resolve) => {
    server.on("metric", (metric) => {
      t.equal(metric.toString(), "ns1.some-host.some.metric:1|s");
      hostnameStub.restore();
      resolve();
    });
    client.set("some.metric", 1);
  });
});

t.test("hostname with dots substitution", (t) => {
  const host = new URL(`udp://127.0.0.1:${address.port}`);
  const namespace = "ns1.${hostname}";
  const hostnameStub = sinon.stub(os, "hostname").returns("some.nice.host");
  const client = new Client({ host, namespace });
  return new Promise<void>((resolve) => {
    server.on("metric", (metric) => {
      t.equal(metric.toString(), "ns1.some_nice_host.some.metric:1|s");
      hostnameStub.restore();
      resolve();
    });
    client.set("some.metric", 1);
  });
});

t.test("pid substitution", (t) => {
  const host = new URL(`udp://127.0.0.1:${address.port}`);
  const namespace = "ns1.${pid}";
  const client = new Client({ host, namespace });
  return new Promise<void>((resolve) => {
    server.on("metric", (metric) => {
      t.equal(metric.toString(), `ns1.${process.pid}.some.metric:1|s`);
      resolve();
    });
    client.set("some.metric", 1);
  });
});

t.test("hostname and pid substitution", (t) => {
  const host = new URL(`udp://127.0.0.1:${address.port}`);
  const namespace = "ns1.${hostname}.${pid}";
  const hostnameStub = sinon.stub(os, "hostname").returns("some-host");
  const client = new Client({ host, namespace });
  return new Promise<void>((resolve) => {
    server.on("metric", (metric) => {
      t.equal(
        metric.toString(),
        `ns1.some-host.${process.pid}.some.metric:1|s`,
      );
      hostnameStub.restore();
      resolve();
    });
    client.set("some.metric", 1);
  });
});

t.test("error", (t) => {
  return new Promise<void>((resolve) => {
    const namespace = "ns1";
    let timer: NodeJS.Timeout;
    const onError = (error: Error & { code?: string }) => {
      clearInterval(timer);
      t.equal(error.code, "ENOTFOUND");
      resolve();
    };
    const client = new Client({
      host: "udp://xfdfsfsdfs.xyzv.:4343",
      namespace,
      onError,
    });
    timer = setInterval(() => {
      client.set("some.metric", 1);
    }, 200);
  });
});

t.test("onError is noop by default", (t) => {
  return new Promise<void>((resolve) => {
    const client = new Client({
      host: "udp://xfdfsfsdfs.xyzv.:4343",
      namespace: "ns1",
    });
    setTimeout(() => {
      client.set("some.metric", 1);
    }, 200);
    setTimeout(() => resolve(), 400);
  });
});

t.test("close with callback", async (t) => {
  const host = new URL(`udp://localhost:${address.port}`);
  const client = new Client({ host, namespace: "ns1.${hostname}.${pid}" });
  await new Promise<void>((resolve) => {
    client.close(() => resolve());
  });
});

t.test("close with callback multiple times", async (t) => {
  const host = new URL(`udp://127.0.0.1:${address.port}`);
  const client = new Client({ host, namespace: "ns1.${hostname}.${pid}" });
  client.close(() => undefined);
  t.doesNotThrow(() => client.close(() => undefined));
  t.doesNotThrow(() => client.timing("time", 1));
});

t.test("close with promise", async (t) => {
  const host = new URL(`udp://127.0.0.1:${address.port}`);
  const client = new Client({ host, namespace: "ns1.${hostname}.${pid}" });
  await client.connect();
  await client.close();
});

t.test("close with promise multiple times", async (t) => {
  const host = new URL(`udp://127.0.0.1:${address.port}`);
  const client = new Client({ host, namespace: "ns1.${hostname}.${pid}" });
  await client.close();
  await client.close();
  t.doesNotThrow(() => client.timing("time", 1));
});

t.test("close with queued messages should wait", async (t) => {
  const host = new URL(`udp://127.0.0.1:${address.port}`);
  const client = new Client({ host, namespace: "ns1.${hostname}.${pid}" });
  client.connect();
  client.counter("some");
  client.counter("some");
  client.counter("some");
  client.counter("some");
  const sock = (client as never as Record<string, Record<string, unknown>>)
    .socket;
  t.equal(sock.pendingMessages, 4);
  const emit = sinon.spy(sock, "emit");
  await client.close();
  t.equal(sock.pendingMessages, 0);
  t.doesNotThrow(() => client.timing("time", 1));
  t.ok(emit.calledOnceWith("idle"));
});

t.test("getSupportedTypes test", async (t) => {
  const host = new URL(`udp://127.0.0.1:${address.port}`);
  const client = new Client({ host });
  const clientMap = client as never as Record<string, unknown>;
  for (const key of Object.keys(client.getSupportedTypes())) {
    t.ok(clientMap[key]);
  }
});

// Buffer tests

t.test("flushing buffer timeout", (t) => {
  return new Promise<void>((resolve) => {
    const clock = sinon.useFakeTimers();
    const host = new URL(`udp://127.0.0.1:${address.port}`);
    const client = new Client({ host, bufferSize: 1024 });
    const clientAny = client as never as Record<string, unknown>;
    const time = process.hrtime();
    const flush = (clientAny.flush as () => void).bind(client);
    (clientAny.flush as unknown) = () => {
      const diff = process.hrtime(time);
      flush();
      const interval = diff[0] * 1e9 + diff[1];
      console.log(`flush called after: ${interval} nanoseconds`);
      t.ok(interval === 1e8);
      t.equal((clientAny.buffer as Record<string, unknown>).length, 0);
      t.equal((clientAny.buffer as Record<string, unknown>).data, "");
      t.equal(clientAny.timeoutActive, false);
      clock.restore();
      (clientAny.flush as unknown) = () => {};
      client.close(() => resolve());
    };
    t.equal(clientAny.timeout, null);
    client.counter("hits");
    t.equal(clientAny.timeoutActive, true);
    const metric = "hits:1|c";
    t.equal(
      (clientAny.buffer as Record<string, unknown>).length,
      Buffer.byteLength(metric),
    );
    t.equal((clientAny.buffer as Record<string, unknown>).data, metric);
    clock.tick(150);
  });
});

t.test("flushing full buffer", (t) => {
  return new Promise<void>((resolve) => {
    const clock = sinon.useFakeTimers();
    const host = new URL(`udp://127.0.0.1:${address.port}`);
    const client = new Client({ host, bufferSize: 1 });
    const clientAny = client as never as Record<string, unknown>;
    client.connect();
    const time = process.hrtime();
    const flush = (clientAny.flush as () => void).bind(client);
    (clientAny.flush as unknown) = () => {
      const diff = process.hrtime(time);
      flush();
      const interval = diff[0] * 1e9 + diff[1];
      console.log(`flush called after: ${interval} nanoseconds`);
      t.ok(interval === 0);
      t.equal((clientAny.buffer as Record<string, unknown>).length, 0);
      t.equal((clientAny.buffer as Record<string, unknown>).data, "");
      t.equal(clientAny.timeoutActive, false);
      clock.restore();
      (clientAny.flush as unknown) = () => {};
      client.close(() => resolve());
    };
    t.equal(clientAny.timeout, null);
    client.counter("hits");
    t.equal(clientAny.timeoutActive, true);
    const metric = "hits:1|c";
    t.equal(
      (clientAny.buffer as Record<string, unknown>).length,
      Buffer.byteLength(metric),
    );
    t.equal((clientAny.buffer as Record<string, unknown>).data, metric);
    clock.tick(10);
  });
});

t.test("buffering mode", (t) => {
  return new Promise<void>((resolve) => {
    const clock = sinon.useFakeTimers();
    const host = new URL(`udp://127.0.0.1:${address.port}`);
    const client = new Client({ host, bufferSize: 20 });
    const clientAny = client as never as Record<string, unknown>;
    const time = process.hrtime();
    const flush = (clientAny.flush as () => void).bind(client);
    let count = 0;
    (clientAny.flush as unknown) = () => {
      const diff = process.hrtime(time);
      flush();
      const interval = diff[0] * 1e9 + diff[1];
      if (count === 0) {
        console.log(`flush called after: ${interval} nanoseconds`);
        t.ok(interval === 1e8);
        t.equal((clientAny.buffer as Record<string, unknown>).length, 0);
        t.equal((clientAny.buffer as Record<string, unknown>).data, "");
        t.equal(clientAny.timeoutActive, false);
      } else if (count === 1) {
        console.log(`flush called after: ${interval} nanoseconds`);
        t.ok(interval === 4e8);
        t.equal((clientAny.buffer as Record<string, unknown>).length, 0);
        t.equal((clientAny.buffer as Record<string, unknown>).data, "");
        t.equal(clientAny.timeoutActive, false);
      }
      count++;
    };
    t.equal(clientAny.timeout, null);
    const firstPart = "hits:1|c\nhits:1|c";
    const secondPart = "hits:1|c";
    client.counter("hits");
    client.counter("hits");
    setTimeout(() => {
      client.counter("hits");
      t.equal(
        (clientAny.buffer as Record<string, unknown>).length,
        Buffer.byteLength(secondPart),
      );
      t.equal((clientAny.buffer as Record<string, unknown>).data, secondPart);
    }, 300);
    t.equal(clientAny.timeoutActive, true);
    t.equal(
      (clientAny.buffer as Record<string, unknown>).length,
      Buffer.byteLength(firstPart),
    );
    t.equal((clientAny.buffer as Record<string, unknown>).data, firstPart);
    let received = 0;
    server.on("metric", (v) => {
      console.log("metric", v.toString());
      if (received === 0) {
        t.equal(v.toString(), firstPart);
        received++;
      } else {
        t.equal(v.toString(), secondPart);
        t.ok(clientAny.timeout !== null);
        server.removeAllListeners("metric");
        clock.restore();
        client.close(() => resolve());
      }
    });
    clock.tick(1000);
  });
});

// UDP socket
t.test("UDP does not throw for two close calls", async (t) => {
  const host = new URL(`udp://127.0.0.1:${address.port}`);
  const socket = new SocketUdp(host);
  await socket.connect();
  await socket.close();
  await socket.close();
});

// dns cache tests
t.test("UDP dns cache should work", (t) => {
  const host = new URL(`udp://blabla:${address.port}`);
  const mock = sinon.fake(function (this: unknown, ...args: unknown[]) {
    for (const cb of args) {
      if (typeof cb === "function") {
        (cb as (err: null, addr: string) => void)(null, "127.0.0.1");
      }
    }
  });

  let cachableCalled = false;
  const cachable = () => {
    cachableCalled = true;
    return mock as never;
  };

  const socket = new SocketUdp(
    host,
    undefined,
    true,
    120,
    undefined,
    cachable as never,
  );
  socket.connect();
  return new Promise<void>((resolve) => {
    server.on("metric", (metric) => {
      t.equal(metric.toString(), "some.metric");
      t.ok(cachableCalled);
      t.ok(mock.called);
      resolve();
    });
    socket.send("some.metric");
  });
});

t.test("UDP dns cache can be disabled", (t) => {
  const host = new URL(`udp://localhost:${address.port}`);
  const mock = sinon.fake(function (this: unknown, ...args: unknown[]) {
    for (const cb of args) {
      if (typeof cb === "function") {
        (cb as (err: null, addr: string) => void)(null, "127.0.0.1");
      }
    }
  });
  let cachableCalled = false;
  const cachable = () => {
    cachableCalled = true;
    return mock as never;
  };

  const socket = new SocketUdp(
    host,
    (error) => console.log(error),
    false,
    0,
    undefined,
    cachable as never,
  );
  socket.connect();
  return new Promise<void>((resolve) => {
    server.on("metric", (metric) => {
      t.equal(metric.toString(), "some.metric");
      t.notOk(cachableCalled);
      t.ok(mock.notCalled);
      resolve();
    });
    socket.send("some.metric");
  });
});

t.test("UDP dns cache TTL should work", async (t) => {
  const clock = sinon.useFakeTimers();
  const host = new URL(`udp://localhost:${address.port}`);
  const mock = sinon.fake(function (this: unknown, ...args: unknown[]) {
    for (const cb of args) {
      if (typeof cb === "function") {
        (cb as (err: null, addr: string) => void)(null, "127.0.0.1");
      }
    }
  });

  const ttl = 1;
  const cachable = (tt: number, hostname: string) =>
    buildLookupFunction(tt, hostname, mock as unknown as typeof lookup);

  const socket = new SocketUdp(
    host,
    (error) => console.log(error),
    true,
    ttl,
    undefined,
    cachable as never,
  );

  server.on("metric", (metric) => {
    t.equal(metric.toString(), "some.metric");
  });

  clock.tick(100);
  socket.connect();
  socket.send("some.metric");
  t.ok(mock.calledOnce);

  clock.tick(300);
  socket.send("some.metric");
  t.ok(mock.calledOnce);

  clock.tick(700);
  socket.send("some.metric");
  t.ok(mock.calledTwice);

  clock.tick(200);
  socket.send("some.metric");
  t.ok(mock.calledTwice);

  await sleep(100);
  clock.restore();
});

t.test("dns-cache should work", async (t) => {
  const lookupFn = buildLookupFunction(1000, "localhost");
  const [v4addr, v6addr] = await Promise.all([
    new Promise<string>((resolve) => {
      lookupFn(null as never, 4, (_err, addr) => resolve(addr!));
    }),
    new Promise<string>((resolve) => {
      lookupFn(null as never, 6, (_err, addr) => resolve(addr!));
    }),
  ]);
  t.equal(v4addr, "127.0.0.1");
  t.equal(v6addr, "::1");
});
