const { createServer } = require('http');
const Client = require('statsd-client');

const client = new Client({ host: 'localhost' });

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
