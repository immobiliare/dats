'use strict';

const { createServer } = require('http');
const Client = require('../dist/index');

const client = new Client.default({
    host: 'udp://localhost:20000',
    namespace: 'my.custom.namespace.environment',
    bufferSize: 4096,
});

const server = createServer((req, res) => {
    const time = process.hrtime();
    client.counter('route.hit');
    res.on('finish', () => {
        const diff = process.hrtime(time);
        const timing = time[0] * 1e9 + diff[1];
        client.timing('route.res_time', timing);
        client.timing();
    });
    res.end(JSON.stringify({ hello: 'world' }));
});

server.listen(3000);
