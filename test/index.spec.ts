import os from 'os';
import sinon from 'sinon';
import anyTest, { TestInterface } from 'ava';
import Client from './../src/index';
import StatsdMock from './helpers/server';
import { AddressInfo } from 'net';
import { lookup } from 'dns';
import { SocketTcp, SocketUdp } from './../src/socket';
import StatsdMockTCP from './helpers/serverTCP';
import { URL } from 'url';
import net from 'net';
import buildLookupFunction from '../src/dns-cache';
import { promisify } from 'util';

const sleep = promisify(setTimeout);

const nodeVersion = process.version.split('.')[0];

const test = anyTest as TestInterface<{
    hostname: string;
    pid: number;
    server: StatsdMock;
    serverUdp6: StatsdMock;
    serverTcp: StatsdMockTCP;
    address: AddressInfo;
    addressUdp6: AddressInfo;
    addressTcp: AddressInfo | string;
}>;

test.before((t) => {
    t.context.pid = process.pid;
});

test.beforeEach(async (t) => {
    t.context.server = new StatsdMock();
    t.context.serverUdp6 = new StatsdMock(6);
    t.context.serverTcp = new StatsdMockTCP();
    /* eslint require-atomic-updates: 0 */
    t.context.address = await t.context.server.start();
    t.context.addressUdp6 = await t.context.serverUdp6.start();
    t.context.addressTcp = await t.context.serverTcp.start();
});

test.afterEach(async (t) => {
    await t.context.server.stop();
    await t.context.serverUdp6.stop();
    await t.context.serverTcp.stop();
});

test('should throw an error with invalid options', (t) => {
    const list: Array<Array<any>> = [
        [{ namespace: 'ns' }, 'Invalid URL: undefined', 'Invalid URL'],
        [
            { host: 'udp://127.0.0.1:123', namespace: 123 },
            'A namespace string is required',
        ],
        [{ host: 'udp://127.0.0.1', namespace: 'ns' }, 'A port is required'],
        [undefined, 'Invalid URL: undefined', 'Invalid URL'],
        [{ bufferSize: -1 }, 'bufferSize must be a number >= 0'],
        [{ bufferFlushTimeout: -1 }, 'bufferFlushTimeout must be a number > 0'],
    ];

    for (const pair of list) {
        t.throws(
            () => {
                new Client(pair[0]);
            },
            { message: nodeVersion === 'v16' && pair[2] ? pair[2] : pair[1] }
        );
    }
});

test('should clean the namespace string from dots at the beginning', (t) => {
    const list = [
        {
            in: '...s.a.b',
            out: 's.a.b.',
        },
        {
            in: '.s.a.b',
            out: 's.a.b.',
        },
        {
            in: 's.a.b',
            out: 's.a.b.',
        },
    ];

    for (const item of list) {
        const client = new Client({
            namespace: item.in,
            host: 'udp://127.0.0.1:123',
        });
        t.is(item.out, (client as any).namespace);
    }
});

test('counter', (t) => {
    const host = new URL(`udp://127.0.0.1:${t.context.address.port}`);
    const namespace = 'ns1';
    const client = new Client({ host, namespace });
    return new Promise((resolve) => {
        t.context.server.on('metric', (metric) => {
            t.is(`${namespace}.some.metric:1|c`, metric.toString());
            return resolve(0);
        });
        client.counter('some.metric');
    });
});

test('counter with sampling', (t) => {
    const host = new URL(`udp://127.0.0.1:${t.context.address.port}`);
    const namespace = 'ns1';
    const client = new Client({ host, namespace });
    return new Promise((resolve) => {
        t.context.server.on('metric', (metric) => {
            t.is(`${namespace}.some.metric:1|c|@10`, metric.toString());
            return resolve(0);
        });
        client.counter('some.metric', 1, 10);
    });
});

test('timing', (t) => {
    const host = new URL(`udp://127.0.0.1:${t.context.address.port}`);
    const namespace = 'ns1';
    const client = new Client({ host, namespace });
    return new Promise((resolve) => {
        t.context.server.on('metric', (metric) => {
            t.is(`${namespace}.some.metric:1|ms`, metric.toString());
            return resolve(0);
        });
        client.timing('some.metric', 1);
    });
});

test('timing with sampling', (t) => {
    const host = new URL(`udp://127.0.0.1:${t.context.address.port}`);
    const namespace = 'ns1';
    const client = new Client({ host, namespace });
    return new Promise((resolve) => {
        t.context.server.on('metric', (metric) => {
            t.is(`${namespace}.some.metric:1|ms|@10`, metric.toString());
            return resolve(0);
        });
        client.timing('some.metric', 1, 10);
    });
});

test('gauge', (t) => {
    const host = new URL(`udp://127.0.0.1:${t.context.address.port}`);
    const namespace = 'ns1';
    const client = new Client({ host, namespace });
    return new Promise((resolve) => {
        t.context.server.on('metric', (metric) => {
            t.is(`${namespace}.some.metric:1|g`, metric.toString());
            return resolve(0);
        });
        client.gauge('some.metric', 1);
    });
});

test('gauge should ignore sampling', (t) => {
    const host = new URL(`udp://127.0.0.1:${t.context.address.port}`);
    const namespace = 'ns1';
    const client = new Client({ host, namespace });
    return new Promise((resolve) => {
        t.context.server.on('metric', (metric) => {
            t.is(`${namespace}.some.metric:1|g`, metric.toString());
            return resolve(0);
        });
        client.gauge('some.metric', 1, 10);
    });
});

test('set', (t) => {
    const host = new URL(`udp://127.0.0.1:${t.context.address.port}`);
    const namespace = 'ns1';
    const client = new Client({ host, namespace });
    return new Promise((resolve) => {
        t.context.server.on('metric', (metric) => {
            t.is(`${namespace}.some.metric:1|s`, metric.toString());
            return resolve(0);
        });
        client.set('some.metric', 1);
    });
});

test('set should ignore sampling', (t) => {
    const host = new URL(`udp://127.0.0.1:${t.context.address.port}`);
    const namespace = 'ns1';
    const client = new Client({ host, namespace });
    return new Promise((resolve) => {
        t.context.server.on('metric', (metric) => {
            t.is(`${namespace}.some.metric:1|s`, metric.toString());
            return resolve(0);
        });
        client.set('some.metric', 1, 10);
    });
});

test.serial('hostname substitution', (t) => {
    const host = new URL(`udp://127.0.0.1:${t.context.address.port}`);
    const namespace = 'ns1.${hostname}';
    const hostname = sinon.stub(os, 'hostname');
    hostname.onCall(0).returns('some-host');
    const client = new Client({ host, namespace });
    return new Promise((resolve) => {
        t.context.server.on('metric', (metric) => {
            t.is(`ns1.some-host.some.metric:1|s`, metric.toString());
            hostname.restore();
            return resolve(0);
        });
        client.set('some.metric', 1);
    });
});

test.serial('hostname with dots substitution', (t) => {
    const host = new URL(`udp://127.0.0.1:${t.context.address.port}`);
    const namespace = 'ns1.${hostname}';
    const hostname = sinon.stub(os, 'hostname');
    hostname.onCall(0).returns('some.host');
    const client = new Client({ host, namespace });
    return new Promise((resolve) => {
        t.context.server.on('metric', (metric) => {
            t.is(`ns1.some_host.some.metric:1|s`, metric.toString());
            hostname.restore();
            return resolve(0);
        });
        client.set('some.metric', 1);
    });
});

test('pid substitution', (t) => {
    const host = new URL(`udp://127.0.0.1:${t.context.address.port}`);
    const namespace = 'ns1.${pid}';
    const client = new Client({ host, namespace });
    return new Promise((resolve) => {
        t.context.server.on('metric', (metric) => {
            t.is(`ns1.${t.context.pid}.some.metric:1|s`, metric.toString());
            return resolve(0);
        });
        client.set('some.metric', 1);
    });
});

test.serial('hostname and pid substitution', (t) => {
    const host = new URL(`udp://127.0.0.1:${t.context.address.port}`);
    const namespace = 'ns1.${hostname}.${pid}';
    const hostname = sinon.stub(os, 'hostname');
    hostname.onCall(0).returns('some-host');
    const client = new Client({ host, namespace });
    return new Promise((resolve) => {
        t.context.server.on('metric', (metric) => {
            t.is(
                `ns1.some-host.${t.context.pid}.some.metric:1|s`,
                metric.toString()
            );
            hostname.restore();
            return resolve(0);
        });
        client.set('some.metric', 1);
    });
});

test('error', (t) => {
    return new Promise((resolve) => {
        const namespace = 'ns1';
        const timer = setInterval(() => {
            client.set('some.metric', 1);
        }, 200);
        let called = nodeVersion !== 'v12';
        const onError = (error) => {
            clearInterval(timer);
            if (nodeVersion === 'v12' && called) {
                t.is('ERR_SOCKET_CANNOT_SEND', error.code);
            } else t.is('ENOTFOUND', error.code);
            if (called) return resolve(0);
            called = true;
        };
        const client = new Client({
            host: 'udp://xfdfsfsdfs.xyzv.:4343',
            namespace,
            onError,
        });
    });
});

test('onError is noop by default', (t) => {
    return new Promise((resolve) => {
        const namespace = 'ns1';

        const client = new Client({
            host: 'udp://xfdfsfsdfs.xyzv.:4343',
            namespace,
        });
        setTimeout(() => {
            client.set('some.metric', 1);
        }, 200);

        setTimeout(() => {
            t.pass();
            resolve(0);
        }, 400);
    });
});

test('close with callback', async (t) => {
    const host = new URL(`udp://localhost:${t.context.address.port}`);
    const namespace = 'ns1.${hostname}.${pid}';
    const client = new Client({ host, namespace });
    await new Promise((resolve) => {
        client.close(() => resolve(0));
    });
    t.pass();
});

test('close with callback multiple times', async (t) => {
    const host = new URL(`udp://127.0.0.1:${t.context.address.port}`);
    const namespace = 'ns1.${hostname}.${pid}';
    const client = new Client({ host, namespace });
    await promisify(client.close);
    client.close(() => undefined);
    t.notThrows(() => client.close(() => undefined));
    t.notThrows(() => client.timing('time', 1));
});

test('close with promise', async (t) => {
    const host = new URL(`udp://127.0.0.1:${t.context.address.port}`);
    const namespace = 'ns1.${hostname}.${pid}';
    const client = new Client({ host, namespace });
    await client.connect();
    await client.close();
    t.pass();
});

test('close with promise multiple times', async (t) => {
    const host = new URL(`udp://127.0.0.1:${t.context.address.port}`);
    const namespace = 'ns1.${hostname}.${pid}';
    const client = new Client({ host, namespace });
    await t.notThrowsAsync(client.close() as Promise<void>);
    await t.notThrowsAsync(client.close() as Promise<void>);
    t.notThrows(() => client.timing('time', 1));
    t.pass();
});

test.serial('flushing buffer timeout', (t) => {
    return new Promise((resolve) => {
        t.plan(8);
        const clock = sinon.useFakeTimers();
        const host = new URL(`udp://127.0.0.1:${t.context.address.port}`);
        const client = new Client({
            host,
            bufferSize: 1024,
        });
        const time = process.hrtime();
        const flush = (client as any).flush.bind(client);
        // Flush should be called approximately 100ms later
        (client as any).flush = () => {
            const diff = process.hrtime(time);
            flush();
            const interval = diff[0] * 1e9 + diff[1];
            t.log(`flush called after: ${interval} nanosecods`);
            t.true(interval === 1e8);
            t.is(0, (client as any).buffer.length);
            t.is('', (client as any).buffer.data);
            t.false((client as any).timeoutActive);
            clock.restore();
            return resolve(0);
        };
        t.is(null, (client as any).timeout);
        client.counter('hits');
        t.true((client as any).timeoutActive);
        const metric = 'hits:1|c';
        t.is(Buffer.byteLength(metric), (client as any).buffer.length);
        t.is(metric, (client as any).buffer.data);
        clock.tick(150);
    });
});

test.serial('flushing full buffer', (t) => {
    return new Promise((resolve) => {
        t.plan(8);
        const clock = sinon.useFakeTimers();
        const host = new URL(`udp://127.0.0.1:${t.context.address.port}`);
        const client = new Client({
            host,
            bufferSize: 1,
        });
        client.connect();
        // here the flow is strange
        const time = process.hrtime();
        const flush = (client as any).flush.bind(client);
        // Flush should be called before the timeout
        (client as any).flush = () => {
            const diff = process.hrtime(time);
            flush();
            const interval = diff[0] * 1e9 + diff[1];
            t.log(`flush called after: ${interval} nanosecods`);
            t.true(interval === 0);
            t.is(0, (client as any).buffer.length);
            t.is('', (client as any).buffer.data);
            t.false((client as any).timeoutActive);
            clock.restore();
            resolve(0);
        };
        t.is(null, (client as any).timeout);
        client.counter('hits');
        t.true((client as any).timeoutActive);
        const metric = 'hits:1|c';
        t.is(Buffer.byteLength(metric), (client as any).buffer.length);
        t.is(metric, (client as any).buffer.data);
        clock.tick(10);
    });
});

test.serial('buffering mode', (t) => {
    return new Promise((resolve) => {
        t.plan(17);
        const clock = sinon.useFakeTimers();
        const host = new URL(`udp://127.0.0.1:${t.context.address.port}`);
        const client = new Client({
            host,
            bufferSize: 20,
        });
        const time = process.hrtime();
        const flush = (client as any).flush.bind(client);
        let count = 0;
        (client as any).flush = () => {
            const diff = process.hrtime(time);
            flush();
            const interval = diff[0] * 1e9 + diff[1];
            if (count === 0) {
                t.log(`flush called after: ${interval} nanosecods`);
                t.true(interval === 1e8);
                t.is(0, (client as any).buffer.length);
                t.is('', (client as any).buffer.data);
                t.false((client as any).timeoutActive);
            } else if (count === 1) {
                t.log(`flush called after: ${interval} nanosecods`);
                t.true(interval === 4e8);
                t.is(0, (client as any).buffer.length);
                t.is('', (client as any).buffer.data);
                t.false((client as any).timeoutActive);
            }
            count++;
        };
        t.is(null, (client as any).timeout);
        const firstPart = 'hits:1|c\nhits:1|c';
        const secondPart = 'hits:1|c';
        client.counter('hits');
        client.counter('hits');
        setTimeout(() => {
            client.counter('hits');
            t.is(Buffer.byteLength(secondPart), (client as any).buffer.length);
            t.is(secondPart, (client as any).buffer.data);
        }, 300);
        t.true((client as any).timeoutActive);
        t.is(Buffer.byteLength(firstPart), (client as any).buffer.length);
        t.is(firstPart, (client as any).buffer.data);
        let received = 0;
        t.context.server.on('metric', (v) => {
            console.log('metric', v.toString());
            if (received === 0) {
                t.is(firstPart, v.toString());
                received++;
            } else {
                t.is(secondPart, v.toString());
                t.true((client as any).timeout !== null);
                t.context.server.removeAllListeners('metric');
                clock.restore();
                resolve(0);
            }
        });
        clock.tick(1000);
    });
});

test('getSupportedTypes test', (t) => {
    const host = new URL(`udp://127.0.0.1:${t.context.address.port}`);
    const client = new Client({
        host,
    });

    Object.keys(client.getSupportedTypes()).forEach((key) => {
        t.truthy(client[key]);
    });
});

// // Integration test TCP
test('should instanciate TCP socket', (t) => {
    const host = new URL(`tcp://127.0.0.1:${t.context.address.port}`);
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

// // UDP socket

test('UDP does not throw for two close calls', async (t) => {
    const host = new URL(
        `udp://127.0.0.1:${(t.context.address as AddressInfo).port || 0}`
    );
    const socket = new SocketUdp(host);
    await socket.connect();

    await socket.close();
    await t.notThrowsAsync(socket.close());
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

test('UDP dns cache should work', (t) => {
    t.plan(3);
    const host = new URL(`udp://blabla:${t.context.address.port}`);
    const mock = sinon.fake(function () {
        for (const cb of arguments) {
            if (typeof cb === 'function') {
                cb(null, '127.0.0.1');
            }
        }
    });

    const cachable = function () {
        t.pass();
        return mock;
    };

    // @ts-ignore
    const socket = new SocketUdp(host, undefined, true, 120, null, cachable);
    socket.connect();
    return new Promise((resolve) => {
        t.context.server.on('metric', (metric) => {
            t.is(`some.metric`, metric.toString());
            t.true(mock.called);
            return resolve(0);
        });
        socket.send('some.metric');
    });
});

test('UDP dns cache can be disabled', (t) => {
    t.plan(2);
    const host = new URL(`udp://localhost:${t.context.address.port}`);
    const mock = sinon.fake(function () {
        for (const cb of arguments) {
            if (typeof cb === 'function') {
                cb(null, '127.0.0.1');
            }
        }
    });
    const cachable = function () {
        t.pass();
        return mock;
    };

    const socket = new SocketUdp(
        host,
        (error) => console.log(error),
        false,
        0,
        null,
        cachable
    );
    socket.connect();
    return new Promise((resolve) => {
        t.context.server.on('metric', (metric) => {
            t.is(`some.metric`, metric.toString());
            t.true(mock.notCalled);
            resolve(0);
        });
        socket.send('some.metric');
    });
});

test.serial('UDP dns cache TTL should work', async (t) => {
    t.plan(8);
    const clock = sinon.useFakeTimers();
    const host = new URL(`udp://localhost:${t.context.address.port}`);
    const mock = sinon.fake(function () {
        for (const cb of arguments) {
            if (typeof cb === 'function') {
                cb(null, '127.0.0.1');
            }
        }
    });

    const ttl = 1;

    const cachable = (ttl, hostname) =>
        buildLookupFunction(ttl, hostname, mock as unknown as typeof lookup);

    const socket = new SocketUdp(
        host,
        (error) => console.log(error),
        true,
        ttl,
        null,
        cachable
    );

    t.context.server.on('metric', (metric) => {
        t.is(`some.metric`, metric.toString());
    });

    clock.tick(100);
    socket.connect();
    socket.send('some.metric');
    t.true(mock.calledOnce);

    clock.tick(300);
    socket.send('some.metric');
    t.true(mock.calledOnce);

    clock.tick(700);
    // Date.now is 1100 ms than is greater than TTL of 1 second then the entry should be expired.
    socket.send('some.metric');
    t.true(mock.calledTwice);

    clock.tick(200);
    socket.send('some.metric');
    t.true(mock.calledTwice);

    await sleep(100);
    clock.restore();
});

test('dns-cache should work', (t) => {
    return new Promise((resolve) => {
        const lookup = buildLookupFunction(1000, 'localhost');
        lookup(null, 4, (err, addr) => {
            t.is(addr, '127.0.0.1');
        });
        lookup(null, 6, (err, addr) => {
            t.is(addr, '::1');
            resolve(0);
        });
    });
});

// // IPv6 tests
test('should work udp6', (t) => {
    const host = new URL(`udp6://localhost:${t.context.addressUdp6.port}`);
    const namespace = 'ns1';
    const client = new Client({ host, namespace });
    return new Promise((resolve) => {
        t.context.serverUdp6.on('metric', (metric) => {
            t.is(`${namespace}.some.metric:1|c|@10`, metric.toString());
            resolve(0);
        });
        client.counter('some.metric', 1, 10);
    });
});

test('should work udp6 with ip', (t) => {
    const host = new URL(`udp6://[::1]:${t.context.addressUdp6.port}`);
    const namespace = 'ns1';
    const client = new Client({
        host,
        namespace,
    });
    return new Promise((resolve) => {
        t.context.serverUdp6.on('metric', (metric) => {
            t.is(`${namespace}.some.metric:1|c|@10`, metric.toString());
            resolve(0);
        });
        client.counter('some.metric', 1, 10);
    });
});

test('should work udp6 with ip without passing udp version', (t) => {
    const host = new URL(`udp://[::1]:${t.context.addressUdp6.port}`);
    const namespace = 'ns1';
    const client = new Client({
        host,
        namespace,
    });
    return new Promise((resolve) => {
        t.context.serverUdp6.on('metric', (metric) => {
            t.is(`${namespace}.some.metric:1|c|@10`, metric.toString());
            resolve(0);
        });
        client.counter('some.metric', 1, 10);
    });
});

test('If udp version and ip address mismatch should follow the IP version', (t) => {
    const host = new URL(`udp4://[::1]:${t.context.addressUdp6.port}`);
    const namespace = 'ns1';
    const client = new Client({
        host,
        namespace,
    });
    return new Promise((resolve) => {
        t.context.serverUdp6.on('metric', (metric) => {
            t.is(`${namespace}.some.metric:1|c|@10`, metric.toString());
            resolve(0);
        });
        client.counter('some.metric', 1, 10);
    });
});
