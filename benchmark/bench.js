const Client = require('../dist/index');
const Benchmark = require('benchmark');
const net = require('net');
const suite = new Benchmark.Suite();

(async function () {
    const clientBuff = new Client.default({
        host: 'udp://localhost:20000',
        namespace: 'my.custom.namespace',
        bufferSize: 1024,
    });

    const client = new Client.default({
        host: 'udp://localhost:20000',
        namespace: 'my.custom.namespace',
    });

    const server = net
        .createServer((sock) => {
            sock.on('data', (data) => undefined);
        })
        .listen(20001);

    const clientTcp = new Client.default({
        host: 'tcp://localhost:20001',
        namespace: 'my.custom.namespace',
        bufferSize: 1024,
    });
    await clientTcp.connect();

    suite
        .add('dats counter base', () => {
            client.counter('test', 1);
        })
        .add('dats tcp', () => {
            clientTcp.counter('test', 1);
        })
        .add('dats buff counter', () => {
            clientBuff.counter('test', 1);
        })
        .add('dats buff gauge', () => {
            clientBuff.gauge('test', 1);
        })
        .add('dats buff set', () => {
            clientBuff.set('test', 1);
        })
        .add('dats buff timing', () => {
            clientBuff.timing('test', 1);
        })

        .on('cycle', (event) => {
            console.log(String(event.target));
        })
        .on('complete', function () {
            clientTcp.close().catch((e) => console.log(e));
            server.close();
        })
        .on('error', (e) => console.log(e))
        .run({ async: true });
})().catch((e) => console.log(e));
