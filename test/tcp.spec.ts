import net, { AddressInfo } from "net";
import sinon from "sinon";
import t from "tap";
import { setTimeout as sleep } from "timers/promises";
import Client from "../src/index.ts";
import { SocketTcp } from "../src/socket.ts";
import StatsdMockTCP from "./helpers/serverTCP.ts";

let serverTcp: StatsdMockTCP;
let addressTcp: AddressInfo | string | null;

t.beforeEach(async () => {
  serverTcp = new StatsdMockTCP();
  addressTcp = await serverTcp.start();
});

t.afterEach(async () => {
  await serverTcp.stop();
});

function port() {
  return (addressTcp as AddressInfo).port || 0;
}

t.test("TCP socket should throws", async (t) => {
  t.throws(() => new SocketTcp(new URL("tcp://localhost")), {
    message: "A port is required",
  });
  t.throws(() => new SocketTcp({ port: 8080 } as never), {
    message: "The hostname is required",
  });
});

t.test("TCP socket should not reconnect if closed", async (t) => {
  const socket = new SocketTcp(new URL(`tcp://127.0.0.1:${port()}`));
  await socket.connect();
  socket.close();
  (socket as never as Record<string, () => void>).reconnectCb();
});

t.test("TCP socket cannot connect if it is closed", async (t) => {
  const socket = new SocketTcp(new URL(`tcp://127.0.0.1:${port()}`));
  const socketAny = socket as never as Record<
    string,
    (...args: unknown[]) => Promise<unknown>
  >;
  await socketAny._connect();
  socket.close();
  t.equal(await socketAny._connect(), false);
});

t.test(
  "TCP calling twice connect does not create two connections",
  async (t) => {
    const sockMock = sinon.fake(net.createConnection);
    const socket = new SocketTcp(
      new URL(`tcp://127.0.0.1:${port()}`),
      undefined,
      undefined,
      sockMock as never,
    );
    t.equal(await socket.connect(), true);
    t.equal(await socket.connect(), false);
    t.ok(sockMock.calledOnce);
    socket.close();
  },
);

t.test(
  "TCP calling twice connect without await does not create two connections",
  async (t) => {
    const sockMock = sinon.fake(net.createConnection);
    const socket = new SocketTcp(
      new URL(`tcp://127.0.0.1:${port()}`),
      undefined,
      undefined,
      sockMock as never,
    );
    socket.connect();
    socket.connect();
    t.ok(sockMock.calledOnce);
    socket.close();
  },
);

t.test("TCP does not throw for two close calls", async (t) => {
  const socket = new SocketTcp(new URL(`tcp://127.0.0.1:${port()}`));
  await socket.connect();
  await socket.close();
  await socket.close();
});

t.test("TCP does not send if connection is closed", async (t) => {
  const socket = new SocketTcp(new URL(`tcp://127.0.0.1:${port()}`));
  await socket.connect();
  await socket.close();
  const sendFun = sinon.spy(
    (socket as never as Record<string, Record<string, unknown>>).socket,
    "write",
  );
  socket.send("something");
  t.notOk(sendFun.called);
  t.equal(socket.pendingMessages, 0);
  t.equal(socket.idle, true);
});

t.test("TCP close should wait", async (t) => {
  const socket = new SocketTcp(new URL(`tcp://127.0.0.1:${port()}`));
  await socket.connect();
  socket.send("something");
  socket.send("something");
  socket.send("something");
  socket.send("something");
  t.equal(socket.pendingMessages, 4);
  t.equal(socket.idle, false);
  const emit = sinon.spy(socket, "emit");
  await socket.close();
  socket.send("something");
  t.equal(socket.pendingMessages, 0);
  t.equal(socket.idle, true);
  t.ok(emit.calledOnceWith("idle"));
});

t.test(
  "TCP _connect function doesnt create new connections if there is another connection active",
  async (t) => {
    const sockMock = sinon.fake(net.createConnection);
    const socket = new SocketTcp(
      new URL(`tcp://127.0.0.1:${port()}`),
      undefined,
      undefined,
      sockMock as never,
    );
    const socketAny = socket as never as Record<
      string,
      (...args: unknown[]) => Promise<unknown>
    >;
    t.equal(await socketAny._connect(), true);
    t.equal(await socketAny._connect(), true);
    t.ok(sockMock.calledOnce);
    socket.close();
  },
);

t.test(
  "if TCP connect fail then the socket should not reconnect",
  async (t) => {
    const sockMock = sinon.fake(net.createConnection);
    const socket = new SocketTcp(
      new URL("tcp://someinvalidhost:9090"),
      undefined,
      undefined,
      sockMock as never,
    );
    await t.rejects(socket.connect());
    await sleep(1000);
    t.ok(sockMock.calledOnce);
    socket.close();
  },
);

t.test(
  "TCP reconnect should not create UnhandledRejection",
  { timeout: 3000 },
  (t) => {
    return new Promise<void>((resolve, reject) => {
      const sockMock = sinon.fake(net.createConnection);
      const socket = new SocketTcp(
        new URL(`tcp://127.0.0.1:${port()}`),
        undefined,
        undefined,
        sockMock as never,
      );

      const onUnhandledRejection = (reason: unknown) => {
        process.removeListener("unhandledRejection", onUnhandledRejection);
        reject(new Error(`Unexpected unhandled rejection: ${reason}`));
      };
      process.on("unhandledRejection", onUnhandledRejection);

      socket.connect().then(() => {
        serverTcp.stop().then(() => {
          globalThis.setTimeout(() => {
            socket.close();
            t.notOk(sockMock.calledOnce);
            process.removeListener("unhandledRejection", onUnhandledRejection);
            resolve();
          }, 1000);
        });
      });
    });
  },
);

t.test("should instantiate TCP socket", async (t) => {
  const host = new URL(`tcp://127.0.0.1:${port()}`);
  const client = new Client({ host, bufferSize: 20 });
  t.ok(
    (client as never as Record<string, unknown>).socket instanceof SocketTcp,
  );
});

t.test("counter with sampling tcp", (t) => {
  const host = new URL(`tcp://127.0.0.1:${port()}`);
  const namespace = "ns1";
  const client = new Client({ host, namespace });
  return new Promise<void>((resolve) => {
    client.connect().then(() => {
      serverTcp.on("metric", (metric) => {
        t.equal(metric.toString(), `${namespace}.some.metric:1|c|@10\n`);
        client.close(() => resolve());
      });
      client.counter("some.metric", 1, 10);
    });
  });
});

t.test("set tcp", (t) => {
  const host = new URL(`tcp://127.0.0.1:${port()}`);
  const namespace = "ns1";
  const client = new Client({ host, namespace });
  return new Promise<void>((resolve) => {
    client.connect().then(() => {
      serverTcp.on("metric", (metric) => {
        t.equal(metric.toString(), `${namespace}.some.metric:1|s\n`);
        client.close(() => resolve());
      });
      client.set("some.metric", 1);
    });
  });
});

t.test("tcp reconnection", { timeout: 5000 }, (t) => {
  const host = new URL(`tcp://127.0.0.1:${port()}`);
  const namespace = "ns1";
  const client = new Client({ host, namespace });
  return new Promise<void>((resolve) => {
    client.connect().then(() => {
      serverTcp.once("metric", (metric) => {
        t.equal(metric.toString(), `${namespace}.some.metric:1|s\n`);
        serverTcp.disconnectSocket();
        serverTcp.once("metric", (me) => {
          t.equal(me.toString(), `${namespace}.some.metric:1|s\n`);
          client.close(() => resolve());
        });
        globalThis.setTimeout(() => {
          client.set("some.metric", 1);
        }, 1500);
      });
      client.set("some.metric", 1);
    });
  });
});

t.test(
  "tcp reconnection should not reconnect if closed",
  { timeout: 3000 },
  (t) => {
    const host = new URL(`tcp://127.0.0.1:${port()}`);
    const namespace = "ns1";
    const client = new Client({ host, namespace });
    const clientAny = client as never as Record<
      string,
      Record<string, (...a: unknown[]) => unknown>
    >;
    return new Promise<void>((resolve) => {
      client.connect().then(() => {
        client.close(() => {
          t.equal(clientAny.socket.isConnected(), false);
          t.equal(clientAny.socket.closing, true);
          globalThis.setTimeout(() => resolve(), 1000);
        });
      });
    });
  },
);
