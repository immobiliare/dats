import os from 'os';
import sinon from 'sinon';
import anyTest, { TestInterface } from 'ava';
import Client from '../src/index';
import { AddressInfo } from 'net';
import { SocketTcp } from '../src/socket';
import StatsdMockTCP from './helpers/serverTCP';
import { URL } from 'url';
import net from 'net';
import { promisify } from 'util';

const sleep = promisify(setTimeout);

const test = anyTest as TestInterface<{
    hostname: string;
    pid: number;
    serverTcp: StatsdMockTCP;
    addressTcp: AddressInfo | string;
}>;

test.before((t) => {
    t.context.pid = process.pid;
});

test.beforeEach(async (t) => {
    t.context.serverTcp = new StatsdMockTCP();
    t.context.addressTcp = await t.context.serverTcp.start();
});

test.afterEach(async (t) => {
    await t.context.serverTcp.stop();
});

// // TCP socket
test('TCP socket should throws', (t) => {
    t.is(
        t.throws(() => new SocketTcp(new URL('tcp://localhost'))).message,
        'A port is required'
    );
    t.is(
        t.throws(() => new SocketTcp({ port: 8080 } as any)).message,
        'The hostname is required'
    );
});

test('TCP socket should not reconnect if closed', async (t) => {
    const host = new URL(
        `tcp://127.0.0.1:${(t.context.addressTcp as AddressInfo).port || 0}`
    );
    const socket = new SocketTcp(host);
    await socket.connect();
    socket.close();
    (socket as any).reconnectCb();
    t.pass();
});

test('TCP socket cannot connect if it is closed', async (t) => {
    const host = new URL(
        `tcp://127.0.0.1:${(t.context.addressTcp as AddressInfo).port || 0}`
    );
    const socket = new SocketTcp(host);
    await (socket as any)._connect();
    socket.close();
    t.is(await (socket as any)._connect(), false);
});

test('TCP calling twice connect does not create two connections', async (t) => {
    const host = new URL(
        `tcp://127.0.0.1:${(t.context.addressTcp as AddressInfo).port || 0}`
    );
    const sockMock = sinon.fake(net.createConnection);
    const socket = new SocketTcp(host, undefined, null, sockMock);
    t.is(await socket.connect(), true);
    t.is(await socket.connect(), false);
    t.true(sockMock.calledOnce);
    socket.close();
});

test('TCP calling twice connect without await does not create two connections', async (t) => {
    const host = new URL(
        `tcp://127.0.0.1:${(t.context.addressTcp as AddressInfo).port || 0}`
    );
    const sockMock = sinon.fake(net.createConnection);

    const socket = new SocketTcp(host, undefined, null, sockMock);
    socket.connect();
    socket.connect();
    t.true(sockMock.calledOnce);
    socket.close();
});

test('TCP does not throw for two close calls', async (t) => {
    const host = new URL(
        `tcp://127.0.0.1:${(t.context.addressTcp as AddressInfo).port || 0}`
    );
    const socket = new SocketTcp(host);
    await socket.connect();

    await socket.close();
    await t.notThrowsAsync(socket.close());
});

test('TCP does not send if connection is closed', async (t) => {
    const host = new URL(
        `tcp://127.0.0.1:${(t.context.addressTcp as AddressInfo).port || 0}`
    );
    const socket = new SocketTcp(host);
    await socket.connect();
    await socket.close();
    const sendFun = sinon.spy((socket as any).socket, 'write');
    socket.send('something');
    t.true(sendFun.notCalled);
});

test('TCP _connect function doesnt create new connections if there is another connection active', async (t) => {
    const host = new URL(
        `tcp://127.0.0.1:${(t.context.addressTcp as AddressInfo).port || 0}`
    );
    const sockMock = sinon.fake(net.createConnection);
    const socket = new SocketTcp(host, undefined, null, sockMock);
    t.is(await (socket as any)._connect(), true);
    t.is(await (socket as any)._connect(), true);
    t.true(sockMock.calledOnce);
    socket.close();
});

test('if TCP connect fail then the socket should not reconnect', async (t) => {
    const host = new URL(`tcp://someinvalidhost:9090`);
    const sockMock = sinon.fake(net.createConnection);
    const socket = new SocketTcp(host, undefined, null, sockMock);
    await t.throwsAsync(socket.connect());
    // Wait a second to be sure that there is no reconnection attempt.
    await sleep(1000);

    t.true(sockMock.calledOnce);
    socket.close();
});

test('TCP reconnect should not create UnhandledRejection', (t) => {
    const host = new URL(
        `tcp://127.0.0.1:${(t.context.addressTcp as AddressInfo).port || 0}`
    );
    const sockMock = sinon.fake(net.createConnection);
    const socket = new SocketTcp(host, undefined, null, sockMock);

    process.on('unhandledRejection', () => {
        t.fail();
    });

    return new Promise((resolve) => {
        socket.connect().then(() => {
            t.context.serverTcp.stop().then(() => {
                setTimeout(() => {
                    socket.close();
                    t.false(sockMock.calledOnce);
                    resolve(0);
                }, 1000);
            });
        });
    });
});

// Integration test TCP
test('should instanciate TCP socket', (t) => {
    const host = new URL(`tcp://127.0.0.1:${t.context.addressTcp.port}`);
    const client = new Client({
        host,
        bufferSize: 20,
    });
    t.true((client as any).socket instanceof SocketTcp);
});

test('counter with sampling tcp', (t) => {
    const host = new URL(
        `tcp://127.0.0.1:${(t.context.addressTcp as AddressInfo).port || 0}`
    );
    const namespace = 'ns1';
    const client = new Client({ host, namespace });
    return new Promise((resolve) => {
        client.connect().then(() => {
            t.context.serverTcp.on('metric', (metric) => {
                t.is(`${namespace}.some.metric:1|c|@10\n`, metric.toString());
                client.close(() => resolve(0));
            });
            client.counter('some.metric', 1, 10);
        });
    });
});

test('set tcp', (t) => {
    const host = new URL(
        `tcp://127.0.0.1:${(t.context.addressTcp as AddressInfo).port || 0}`
    );
    const namespace = 'ns1';
    const client = new Client({ host, namespace });

    return new Promise((resolve) => {
        client.connect().then(() => {
            t.context.serverTcp.on('metric', (metric) => {
                t.is(`${namespace}.some.metric:1|s\n`, metric.toString());
                client.close(() => resolve(0));
            });
            client.set('some.metric', 1);
        });
    });
});

test('tcp reconnection', (t) => {
    t.plan(2);
    const host = new URL(
        `tcp://127.0.0.1:${(t.context.addressTcp as AddressInfo).port || 0}`
    );
    const namespace = 'ns1';
    const client = new Client({ host, namespace });
    // To refactor
    return new Promise((resolve) => {
        client.connect().then(() => {
            t.context.serverTcp.once('metric', (metric) => {
                t.is(`${namespace}.some.metric:1|s\n`, metric.toString());
                t.context.serverTcp.disconnectSocket();
                t.context.serverTcp.once('metric', (me) => {
                    t.is(`${namespace}.some.metric:1|s\n`, me.toString());
                    client.close(() => resolve(0));
                });
                setTimeout(() => {
                    client.set('some.metric', 1);
                }, 1500);
            });
            client.set('some.metric', 1);
        });
    });
});

test('tcp reconnection should not reconnect if closed', (t) => {
    t.plan(2);
    const host = new URL(
        `tcp://127.0.0.1:${(t.context.addressTcp as AddressInfo).port || 0}`
    );
    const namespace = 'ns1';
    const client = new Client({ host, namespace });

    return new Promise((resolve) => {
        client.connect().then(() => {
            client.close(() => {
                t.is((client as any).socket.isConnected(), false);
                t.is((client as any).socket.closing, true);
                setTimeout(() => resolve(0), 1000);
            });
        });
    });
});
