'use strict';

const { createServer } = require('http');

const server = createServer((req, res) => {
    const time = process.hrtime();
    res.on('finish', () => {
        const diff = process.hrtime(time);
        const timing = time[0] * 1e9 + diff[1]; // eslint-disable-line
    });
    res.end(JSON.stringify({ hello: 'world' }));
});

server.listen(3000);
