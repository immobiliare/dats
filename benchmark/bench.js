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
        .add('dats counter udp base', () => {
            client.counter('test_some_string', Number.MAX_SAFE_INTEGER);
        })
        .add('dats counter udp buffered', () => {
            clientBuff.counter('test_some_string', Number.MAX_SAFE_INTEGER);
        })
        .add('dats gauge udp buffered', () => {
            clientBuff.gauge('test_some_string', Number.MAX_SAFE_INTEGER);
        })
        .add('dats set udp buffered', () => {
            clientBuff.set('test_some_string', Number.MAX_SAFE_INTEGER);
        })
        .add('dats timing udp buffered', () => {
            clientBuff.timing('test_some_string', Number.MAX_SAFE_INTEGER);
        })
        .add('dats counter tcp buffered', () => {
            clientTcp.counter('test_some_string', Number.MAX_SAFE_INTEGER);
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
