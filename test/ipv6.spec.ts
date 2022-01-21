import anyTest, { TestInterface } from 'ava';
import Client from './../src/index';
import StatsdMock from './helpers/server';
import { AddressInfo } from 'net';
import { URL } from 'url';

const test = anyTest as TestInterface<{
    hostname: string;
    pid: number;
    server: StatsdMock;
    serverUdp6: StatsdMock;
    addressUdp6: AddressInfo;
}>;

test.before((t) => {
    t.context.pid = process.pid;
});

test.beforeEach(async (t) => {
    t.context.serverUdp6 = new StatsdMock(6);
    t.context.addressUdp6 = await t.context.serverUdp6.start();
});

test.afterEach(async (t) => {
    await t.context.serverUdp6.stop();
});

// IPv6 tests
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
