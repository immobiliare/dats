import os from 'os';
import sinon from 'sinon';
import anyTest, { TestFn } from 'ava';
import Client from './../src/index';
import StatsdMock from './helpers/server';
import { AddressInfo } from 'net';
import { lookup } from 'dns';
import { SocketUdp } from './../src/socket';
import { URL } from 'url';
import buildLookupFunction from '../src/dns-cache';
import { promisify } from 'util';

const sleep = promisify(setTimeout);

const nodeVersion = process.version.split('.')[0];

const test = anyTest as TestFn<{
    hostname: string;
    pid: number;
    server: StatsdMock;
    address: AddressInfo;
}>;

test.before((t) => {
    t.context.pid = process.pid;
});

test.beforeEach(async (t) => {
    t.context.server = new StatsdMock();
    t.context.address = await t.context.server.start();
});

test.afterEach(async (t) => {
    await t.context.server.stop();
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
            {
                message:
                    nodeVersion.match(/v1[68]/) && pair[2] ? pair[2] : pair[1],
            }
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
    return new Promise<number>((resolve) => {
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
    return new Promise<number>((resolve) => {
        t.context.server.on('metric', (metric) => {
            t.is(`${namespace}.some.metric:1|c|@10`, metric.toString());
            return resolve(0);
        });
        client.counter('some.metric', 1, 10);
    });
});

test('counter with tags', (t) => {
    const host = new URL(`udp://127.0.0.1:${t.context.address.port}`);
    const namespace = 'ns1';
    const tags = { tag1: 'value1', tag2: null, tag3: 'value3' };
    const client = new Client({ host, namespace, tags });
    return new Promise<number>((resolve) => {
        t.context.server.on('metric', (metric) => {
            t.is(
                `${namespace}.some.metric:1|c|@10|#tag1:value1,tag2,tag3:value3`,
                metric.toString()
            );
            return resolve(0);
        });
        client.counter('some.metric', 1, 10);
    });
});

test('timing', (t) => {
    const host = new URL(`udp://127.0.0.1:${t.context.address.port}`);
    const namespace = 'ns1';
    const client = new Client({ host, namespace });
    return new Promise<number>((resolve) => {
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
    return new Promise<number>((resolve) => {
        t.context.server.on('metric', (metric) => {
            t.is(`${namespace}.some.metric:1|ms|@10`, metric.toString());
            return resolve(0);
        });
        client.timing('some.metric', 1, 10);
    });
});

test('timing with tags', (t) => {
    const host = new URL(`udp://127.0.0.1:${t.context.address.port}`);
    const namespace = 'ns1';
    const tags = { tag1: 'value1', tag2: null, tag3: 'value3' };
    const client = new Client({ host, namespace, tags });
    return new Promise<number>((resolve) => {
        t.context.server.on('metric', (metric) => {
            t.is(
                `${namespace}.some.metric:1|ms|@10|#tag1:value1,tag2,tag3:value3`,
                metric.toString()
            );
            return resolve(0);
        });
        client.timing('some.metric', 1, 10);
    });
});

test('gauge', (t) => {
    const host = new URL(`udp://127.0.0.1:${t.context.address.port}`);
    const namespace = 'ns1';
    const client = new Client({ host, namespace });
    return new Promise<number>((resolve) => {
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
    return new Promise<number>((resolve) => {
        t.context.server.on('metric', (metric) => {
            t.is(`${namespace}.some.metric:1|g`, metric.toString());
            return resolve(0);
        });
        client.gauge('some.metric', 1);
    });
});

test('gauge with tags', (t) => {
    const host = new URL(`udp://127.0.0.1:${t.context.address.port}`);
    const namespace = 'ns1';
    const tags = { tag1: 'value1', tag2: null, tag3: 'value3' };
    const client = new Client({ host, namespace, tags });
    return new Promise<number>((resolve) => {
        t.context.server.on('metric', (metric) => {
            t.is(
                `${namespace}.some.metric:1|g|#tag1:value1,tag2,tag3:value3`,
                metric.toString()
            );
            return resolve(0);
        });
        client.gauge('some.metric', 1);
    });
});

test('set', (t) => {
    const host = new URL(`udp://127.0.0.1:${t.context.address.port}`);
    const namespace = 'ns1';
    const client = new Client({ host, namespace });
    return new Promise<number>((resolve) => {
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
    return new Promise<number>((resolve) => {
        t.context.server.on('metric', (metric) => {
            t.is(`${namespace}.some.metric:1|s`, metric.toString());
            return resolve(0);
        });
        client.set('some.metric', 1);
    });
});

test('set with tags', (t) => {
    const host = new URL(`udp://127.0.0.1:${t.context.address.port}`);
    const namespace = 'ns1';
    const tags = { tag1: 'value1', tag2: null, tag3: 'value3' };
    const client = new Client({ host, namespace, tags });
    return new Promise<number>((resolve) => {
        t.context.server.on('metric', (metric) => {
            t.is(
                `${namespace}.some.metric:1|s|#tag1:value1,tag2,tag3:value3`,
                metric.toString()
            );
            return resolve(0);
        });
        client.set('some.metric', 1);
    });
});

test.serial('hostname substitution', (t) => {
    const host = new URL(`udp://127.0.0.1:${t.context.address.port}`);
    const namespace = 'ns1.${hostname}';
    const hostname = sinon.stub(os, 'hostname');
    hostname.onCall(0).returns('some-host');
    const client = new Client({ host, namespace });
    return new Promise<number>((resolve) => {
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
    hostname.onCall(0).returns('some.nice.host');
    const client = new Client({ host, namespace });
    return new Promise<number>((resolve) => {
        t.context.server.on('metric', (metric) => {
            t.is(`ns1.some_nice_host.some.metric:1|s`, metric.toString());
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
    return new Promise<number>((resolve) => {
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
    return new Promise<number>((resolve) => {
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
    return new Promise<number>((resolve) => {
        const namespace = 'ns1';
        const timer = setInterval(() => {
            client.set('some.metric', 1);
        }, 200);
        const onError = (error) => {
            clearInterval(timer);
            t.is('ENOTFOUND', error.code);
            return resolve(0);
        };
        const client = new Client({
            host: 'udp://xfdfsfsdfs.xyzv.:4343',
            namespace,
            onError,
        });
    });
});

test('onError is noop by default', (t) => {
    return new Promise<number>((resolve) => {
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

test('close with queued messages should wait', async (t) => {
    const host = new URL(`udp://127.0.0.1:${t.context.address.port}`);
    const namespace = 'ns1.${hostname}.${pid}';
    const client = new Client({ host, namespace });
    t.plan(6);
    client.connect();
    client.counter('some');
    client.counter('some');
    client.counter('some');
    client.counter('some');
    //@ts-expect-error Just for tests
    t.is(client.socket.pendingMessages, 4);
    //@ts-expect-error Just for tests
    const emit = sinon.spy(client.socket, 'emit');
    await t.notThrowsAsync(client.close() as Promise<void>);
    //@ts-expect-error Just for tests
    t.is(client.socket.pendingMessages, 0);
    t.notThrows(() => client.timing('time', 1));
    t.true(emit.calledOnceWith('idle'));
    t.pass();
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

// Buffer tests

test.serial('flushing buffer timeout', (t) => {
    return new Promise<number>((resolve) => {
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
    return new Promise<number>((resolve) => {
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
    return new Promise<number>((resolve) => {
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

// dns cache tests
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
    return new Promise<number>((resolve) => {
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
    return new Promise<number>((resolve) => {
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
    return new Promise<number>((resolve) => {
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
