const { createServer } = require('http');
const StatsD = require('hot-shots');
const client = new StatsD({
    port: 8020,
    maxBufferSize: 4096,
    bufferFlushInterval: 100,
});

const server = createServer((req, res) => {
    const time = process.hrtime();
    client.increment('route.hit');
    res.on('finish', () => {
        const diff = process.hrtime(time);
        const timing = time[0] * 1e9 + diff[1];
        client.timing('some.time', timing);
        client.timing('blaa', 0);
    });
    res.end(JSON.stringify({ hello: 'world' }));
});

server.listen(3000);
