import ClientMock from './../src/mock';
import { URL } from 'url';
import test from 'ava';

test('mock works', (t) => {
    const host = new URL(`udp://127.0.0.1:8232`);
    const namespace = 'ns1';
    const client = new ClientMock({ host, namespace });
    client.counter('some.metric', 1, 10);
    client.timing('some.metric', 100);
    client.gauge('some.metric', 100);
    client.set('some.metric', 100);
    t.deepEqual(client.metrics, [
        'ns1.some.metric:1|c|@10',
        'ns1.some.metric:100|ms',
        'ns1.some.metric:100|g',
        'ns1.some.metric:100|s',
    ]);
});

test('mock clean works', (t) => {
    const host = new URL(`udp://127.0.0.1:8232`);
    const namespace = 'ns1';
    const client = new ClientMock({ host, namespace });

    client.gauge('some.metric', 100);
    client.set('some.metric', 100);
    t.deepEqual(client.metrics, [
        'ns1.some.metric:100|g',
        'ns1.some.metric:100|s',
    ]);
    client.cleanMetrics();

    client.counter('some.metric', 1, 10);
    client.timing('some.metric', 100);
    t.deepEqual(client.metrics, [
        'ns1.some.metric:1|c|@10',
        'ns1.some.metric:100|ms',
    ]);
});

test('mock close works', (t) => {
    const host = new URL(`udp://127.0.0.1:8232`);
    const namespace = 'ns1';
    const client = new ClientMock({ host, namespace });

    client.gauge('some.metric', 100);
    client.set('some.metric', 100);
    t.deepEqual(client.metrics, [
        'ns1.some.metric:100|g',
        'ns1.some.metric:100|s',
    ]);
    client.close();

    client.counter('some.metric', 1, 10);
    client.timing('some.metric', 100);
    t.deepEqual(client.metrics, [
        'ns1.some.metric:100|g',
        'ns1.some.metric:100|s',
    ]);
});

test('mock hasSent works', (t) => {
    const host = new URL(`udp://127.0.0.1:8232`);
    const namespace = 'ns1';
    const client = new ClientMock({ host, namespace });

    client.gauge('some.metric', 100);
    client.set('some.metric', 100);
    t.true(client.hasSent('ns1.some.metric:100|g'));
    t.false(client.hasSent('ns1.some.metric:1020|g'));
    t.true(client.hasSent(/ns1\.some\.metric:\d+\|g/));
    t.false(client.hasSent(/ns1\.some\.metric:\d+\|yt/));
});
