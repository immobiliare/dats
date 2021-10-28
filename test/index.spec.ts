import { hostname } from 'os';
import sinon from 'sinon';
import anyTest, { TestInterface } from 'ava';
import Client from './../src/index';
import StatsdMock from './helpers/server';
import { AddressInfo, LookupFunction } from 'net';
import { SocketTcp, SocketUdp } from './../src/socket';
import StatsdMockTCP from './helpers/serverTCP';
import { URL } from 'url';
import net from 'net';
import isCI from 'is-ci';
import buildLookupFunction from '../src/dns-cache';

import { promisify } from 'util';
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
    t.context.hostname = hostname();
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
                const client = new Client(pair[0]);
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

test.cb('counter', (t) => {
    const host = new URL(`udp://127.0.0.1:${t.context.address.port}`);
    const namespace = 'ns1';
    const client = new Client({ host, namespace });
    t.context.server.on('metric', (metric) => {
        t.is(`${namespace}.some.metric:1|c`, metric.toString());
        t.end();
    });
    client.counter('some.metric');
});

test.cb('counter with sampling', (t) => {
    const host = new URL(`udp://127.0.0.1:${t.context.address.port}`);
    const namespace = 'ns1';
    const client = new Client({ host, namespace });
    t.context.server.on('metric', (metric) => {
        t.is(`${namespace}.some.metric:1|c|@10`, metric.toString());
        t.end();
    });
    client.counter('some.metric', 1, 10);
});

test.cb('timing', (t) => {
    const host = new URL(`udp://127.0.0.1:${t.context.address.port}`);
    const namespace = 'ns1';
    const client = new Client({ host, namespace });
    t.context.server.on('metric', (metric) => {
        t.is(`${namespace}.some.metric:1|ms`, metric.toString());
        t.end();
    });
    client.timing('some.metric', 1);
});

test.cb('timing with sampling', (t) => {
    const host = new URL(`udp://127.0.0.1:${t.context.address.port}`);
    const namespace = 'ns1';
    const client = new Client({ host, namespace });
    t.context.server.on('metric', (metric) => {
        t.is(`${namespace}.some.metric:1|ms|@10`, metric.toString());
        t.end();
    });
    client.timing('some.metric', 1, 10);
});

test.cb('gauge', (t) => {
    const host = new URL(`udp://127.0.0.1:${t.context.address.port}`);
    const namespace = 'ns1';
    const client = new Client({ host, namespace });
    t.context.server.on('metric', (metric) => {
        t.is(`${namespace}.some.metric:1|g`, metric.toString());
        t.end();
    });
    client.gauge('some.metric', 1);
});

test.cb('gauge should ignore sampling', (t) => {
    const host = new URL(`udp://127.0.0.1:${t.context.address.port}`);
    const namespace = 'ns1';
    const client = new Client({ host, namespace });
    t.context.server.on('metric', (metric) => {
        t.is(`${namespace}.some.metric:1|g`, metric.toString());
        t.end();
    });
    client.gauge('some.metric', 1, 10);
});

test.cb('set', (t) => {
    const host = new URL(`udp://127.0.0.1:${t.context.address.port}`);
    const namespace = 'ns1';
    const client = new Client({ host, namespace });
    t.context.server.on('metric', (metric) => {
        t.is(`${namespace}.some.metric:1|s`, metric.toString());
        t.end();
    });
    client.set('some.metric', 1);
});

test.cb('set should ignore sampling', (t) => {
    const host = new URL(`udp://127.0.0.1:${t.context.address.port}`);
    const namespace = 'ns1';
    const client = new Client({ host, namespace });
    t.context.server.on('metric', (metric) => {
        t.is(`${namespace}.some.metric:1|s`, metric.toString());
        t.end();
    });
    client.set('some.metric', 1, 10);
});

test.cb('hostname substitution', (t) => {
    const host = new URL(`udp://127.0.0.1:${t.context.address.port}`);
    const namespace = 'ns1.${hostname}';
    const client = new Client({ host, namespace });
    t.context.server.on('metric', (metric) => {
        t.is(`ns1.${t.context.hostname}.some.metric:1|s`, metric.toString());
        t.end();
    });
    client.set('some.metric', 1);
});

test.cb('pid substitution', (t) => {
    const host = new URL(`udp://127.0.0.1:${t.context.address.port}`);
    const namespace = 'ns1.${pid}';
    const client = new Client({ host, namespace });
    t.context.server.on('metric', (metric) => {
        t.is(`ns1.${t.context.pid}.some.metric:1|s`, metric.toString());
        t.end();
    });
    client.set('some.metric', 1);
});

test.cb('hostname and pid substitution', (t) => {
    const host = new URL(`udp://127.0.0.1:${t.context.address.port}`);
    const namespace = 'ns1.${hostname}.${pid}';
    const client = new Client({ host, namespace });
    t.context.server.on('metric', (metric) => {
        t.is(
            `ns1.${t.context.hostname}.${t.context.pid}.some.metric:1|s`,
            metric.toString()
        );
        t.end();
    });
    client.set('some.metric', 1);
});

test.cb('error', (t) => {
    const namespace = 'ns1';
    let timer;
    let called = nodeVersion !== 'v12';
    const onError = (error) => {
        clearInterval(timer);
        if (nodeVersion === 'v12' && called) {
            t.is('ERR_SOCKET_CANNOT_SEND', error.code);
        } else t.is('ENOTFOUND', error.code);
        if (called) t.end();
        called = true;
    };
    const client = new Client({
        host: 'udp://xfdfsfsdfs.xyzv.:4343',
        namespace,
        onError,
    });
    timer = setInterval(() => {
        client.set('some.metric', 1);
    }, 200);
});

test.cb('onError is noop by default', (t) => {
    const host = new URL(`udp://127.0.0.5:${t.context.address.port + 1}`);
    const namespace = 'ns1';

    const client = new Client({
        host: 'udp://xfdfsfsdfs.xyzv.:4343',
        namespace,
    });
    setTimeout(() => {
        client.set('some.metric', 1);
    }, 200);

    setTimeout(() => {
        t.end();
    }, 400);
});

test.cb('close with callback', (t) => {
    const host = new URL(`udp://localhost:${t.context.address.port}`);
    const namespace = 'ns1.${hostname}.${pid}';
    const client = new Client({ host, namespace });
    client.close(t.end);
});

test.cb('close with callback multiple times', (t) => {
    const host = new URL(`udp://127.0.0.1:${t.context.address.port}`);
    const namespace = 'ns1.${hostname}.${pid}';
    const client = new Client({ host, namespace });
    client.close(() => undefined);
    t.notThrows(() => client.close(() => undefined));
    t.notThrows(() => client.timing('time', 1));
    t.end();
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

test.cb('flushing buffer timeout', (t) => {
    t.plan(8);
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
        t.true(interval >= 1e8 && interval <= 2e8);
        t.is(0, (client as any).buffer.length);
        t.is('', (client as any).buffer.data);
        t.false((client as any).timeoutActive);
        t.end();
    };
    t.is(null, (client as any).timeout);
    client.counter('hits');
    t.true((client as any).timeoutActive);
    const metric = 'hits:1|c';
    t.is(Buffer.byteLength(metric), (client as any).buffer.length);
    t.is(metric, (client as any).buffer.data);
});

test.cb('flushing full buffer', (t) => {
    t.plan(8);
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
        t.true(interval > 0 && interval < 1e8);
        t.is(0, (client as any).buffer.length);
        t.is('', (client as any).buffer.data);
        t.false((client as any).timeoutActive);
        t.end();
    };
    t.is(null, (client as any).timeout);
    client.counter('hits');
    t.true((client as any).timeoutActive);
    const metric = 'hits:1|c';
    t.is(Buffer.byteLength(metric), (client as any).buffer.length);
    t.is(metric, (client as any).buffer.data);
});

test.cb('buffering mode', (t) => {
    t.plan(18);
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
            t.true(interval >= 1e8 && interval <= 2e8);
            t.is(0, (client as any).buffer.length);
            t.is('', (client as any).buffer.data);
            t.false((client as any).timeoutActive);
        } else if (count === 1) {
            t.log(`flush called after: ${interval} nanosecods`);
            t.true(interval >= 3e8 + 1e8 && interval <= 3e8 + 2e8);
            t.is(0, (client as any).buffer.length);
            t.is('', (client as any).buffer.data);
            t.false((client as any).timeoutActive);
        }
        count++;
    };
    t.is(null, (client as any).timeout);
    const metric = 'hits:1|c\nhits:1|c';
    t.context.server.once('metric', (value) => t.is(metric, value.toString()));
    client.counter('hits');
    client.counter('hits');
    t.true((client as any).timeoutActive);
    t.is(Buffer.byteLength(metric), (client as any).buffer.length);
    t.is(metric, (client as any).buffer.data);
    setTimeout(() => {
        t.is(false, (client as any).timeoutActive);
        const metric = 'hits:1|c';
        t.context.server.once('metric', (value) => {
            t.is(metric, value.toString());
            t.end();
        });
        client.counter('hits');
        t.true((client as any).timeout !== null);
        t.is(Buffer.byteLength(metric), (client as any).buffer.length);
        t.is(metric, (client as any).buffer.data);
    }, 300);
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

// Integration test TCP
test('should instanciate TCP socket', (t) => {
    const host = new URL(`tcp://127.0.0.1:${t.context.address.port}`);
    const client = new Client({
        host,
        bufferSize: 20,
    });
    t.true((client as any).socket instanceof SocketTcp);
});

test.cb('counter with sampling tcp', (t) => {
    const host = new URL(
        `tcp://127.0.0.1:${(t.context.addressTcp as AddressInfo).port || 0}`
    );
    const namespace = 'ns1';
    const client = new Client({ host, namespace });

    client.connect().then(() => {
        t.context.serverTcp.on('metric', (metric) => {
            t.is(`${namespace}.some.metric:1|c|@10\n`, metric.toString());
            client.close(() => t.end());
        });
        client.counter('some.metric', 1, 10);
    });
});

test.cb('set tcp', (t) => {
    const host = new URL(
        `tcp://127.0.0.1:${(t.context.addressTcp as AddressInfo).port || 0}`
    );
    const namespace = 'ns1';
    const client = new Client({ host, namespace });

    client.connect().then(() => {
        t.context.serverTcp.on('metric', (metric) => {
            t.is(`${namespace}.some.metric:1|s\n`, metric.toString());
            client.close(() => t.end());
        });
        client.set('some.metric', 1);
    });
});

test.cb('tcp reconnection', (t) => {
    t.plan(2);
    const host = new URL(
        `tcp://127.0.0.1:${(t.context.addressTcp as AddressInfo).port || 0}`
    );
    const namespace = 'ns1';
    const client = new Client({ host, namespace });

    // To refactor
    client.connect().then(() => {
        t.context.serverTcp.once('metric', (metric) => {
            t.is(`${namespace}.some.metric:1|s\n`, metric.toString());
            t.context.serverTcp.disconnectSocket();
            t.context.serverTcp.once('metric', (me) => {
                t.is(`${namespace}.some.metric:1|s\n`, me.toString());
                client.close(() => t.end());
            });
            setTimeout(() => {
                client.set('some.metric', 1);
            }, 1500);
        });
        client.set('some.metric', 1);
    });
});

test.cb('tcp reconnection should not reconnect if closed', (t) => {
    t.plan(2);
    const host = new URL(
        `tcp://127.0.0.1:${(t.context.addressTcp as AddressInfo).port || 0}`
    );
    const namespace = 'ns1';
    const client = new Client({ host, namespace });

    client.connect().then(() => {
        client.close(() => {
            t.is((client as any).socket.isConnected(), false);
            t.is((client as any).socket.closing, true);
            setTimeout(() => t.end(), 1000);
        });
    });
});

// UDP socket

test('UDP does not throw for two close calls', async (t) => {
    const host = new URL(
        `udp://127.0.0.1:${(t.context.address as AddressInfo).port || 0}`
    );
    const socket = new SocketUdp(host);
    await socket.connect();

    await socket.close();
    await t.notThrowsAsync(socket.close());
});

// TCP socket
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

    t.true(sockMock.calledOnce);
    socket.close();
});

test.cb('TCP reconnect should not create UnhandledRejection', (t) => {
    const host = new URL(
        `tcp://127.0.0.1:${(t.context.addressTcp as AddressInfo).port || 0}`
    );
    const sockMock = sinon.fake(net.createConnection);
    const socket = new SocketTcp(host, undefined, null, sockMock);
    socket.connect().then((_) => {
        t.context.serverTcp.stop().then(() => {
            setTimeout(() => {
                socket.close();
                t.false(sockMock.calledOnce);
                t.end();
            }, 1000);
        });
    });

    process.on('unhandledRejection', (e) => {
        t.fail();
    });
});

test.cb('UDP dns cache should work', (t) => {
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
    t.context.server.on('metric', (metric) => {
        t.is(`some.metric`, metric.toString());
        t.true(mock.called);
        t.end();
    });
    socket.send('some.metric');
});

test.cb('UDP dns cache can be disabled', (t) => {
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

    // @ts-ignore
    const socket = new SocketUdp(
        host,
        (error) => console.log(error),
        false,
        0,
        null,
        cachable
    );
    socket.connect();
    t.context.server.on('metric', (metric) => {
        t.is(`some.metric`, metric.toString());
        t.true(mock.notCalled);
        t.end();
    });
    socket.send('some.metric');
});

test.cb('UDP dns cache TTL should work', (t) => {
    t.plan(8);
    const host = new URL(`udp://localhost:${t.context.address.port}`);
    const mock = sinon.fake(function () {
        for (const cb of arguments) {
            if (typeof cb === 'function') {
                cb(null, '127.0.0.1');
            }
        }
    });

    const cachable = (_) => {
        return buildLookupFunction(1, host.hostname, mock);
    };

    // @ts-ignore
    const socket = new SocketUdp(
        host,
        (error) => console.log(error),
        true,
        0,
        null,
        cachable
    );

    socket.connect();
    socket.send('some.metric');
    setTimeout(() => {
        socket.send('some.metric');
        t.true(mock.calledOnce);
    }, 400);

    setTimeout(() => {
        socket.send('some.metric');
        process.nextTick(() => {
            t.true(mock.calledOnce);
        });
    }, 600);
    setTimeout(() => {
        socket.send('some.metric');
        t.true(mock.calledTwice);
    }, 1200);

    setTimeout(() => {
        socket.send('some.metric');
        t.true(mock.calledTwice);
        t.end();
    }, 1300);

    t.context.server.on('metric', (metric) => {
        t.is(`some.metric`, metric.toString());
    });
});

test.cb('dns-cache should work', (t) => {
    const lookup = buildLookupFunction(1000, 'localhost');
    lookup(null, 4, (err, addr) => {
        t.is(addr, '127.0.0.1');
    });
    lookup(null, 6, (err, addr) => {
        t.is(addr, '::1');
        t.end();
    });
});

// IPv6 test
if (!isCI) {
    test.cb('should work udp6', (t) => {
        const host = new URL(`udp6://localhost:${t.context.addressUdp6.port}`);
        const namespace = 'ns1';
        const client = new Client({ host, namespace });
        t.context.serverUdp6.on('metric', (metric) => {
            t.is(`${namespace}.some.metric:1|c|@10`, metric.toString());
            t.end();
        });
        client.counter('some.metric', 1, 10);
    });

    test.cb('should work udp6 with ip', (t) => {
        const host = new URL(`udp6://[::1]:${t.context.addressUdp6.port}`);
        const namespace = 'ns1';
        const client = new Client({
            host,
            namespace,
        });
        t.context.serverUdp6.on('metric', (metric) => {
            t.is(`${namespace}.some.metric:1|c|@10`, metric.toString());
            t.end();
        });
        client.counter('some.metric', 1, 10);
    });

    test.cb('should work udp6 with ip without passing udp version', (t) => {
        const host = new URL(`udp://[::1]:${t.context.addressUdp6.port}`);
        const namespace = 'ns1';
        const client = new Client({
            host,
            namespace,
        });
        t.context.serverUdp6.on('metric', (metric) => {
            t.is(`${namespace}.some.metric:1|c|@10`, metric.toString());
            t.end();
        });
        client.counter('some.metric', 1, 10);
    });

    test.cb(
        'If udp version and ip address mismatch should follow the IP version',
        (t) => {
            const host = new URL(`udp4://[::1]:${t.context.addressUdp6.port}`);
            const namespace = 'ns1';
            const client = new Client({
                host,
                namespace,
            });
            t.context.serverUdp6.on('metric', (metric) => {
                t.is(`${namespace}.some.metric:1|c|@10`, metric.toString());
                t.end();
            });
            client.counter('some.metric', 1, 10);
        }
    );
}
