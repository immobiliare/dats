const { createServer } = require('http');
const StatsD = require('node-statsd');
const client = new StatsD();

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
