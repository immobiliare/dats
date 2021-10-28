'use strict';

const dgram = require('dgram');
const EventEmitter = require('events');

class StatsdMock extends EventEmitter {
    constructor() {
        super();
        this.server = dgram.createSocket('udp4');
    }
    start() {
        return new Promise((resolve, reject) => {
            const onError = (error) => {
                return reject(error);
            };
            const onDone = () => {
                this.server.removeListener('error', onError);
                return resolve(this.server.address());
            };
            this.server.once('listening', onDone);
            this.server.once('error', onError);
            this.server.on('message', (msg) => {
                this.emit('metric', msg);
            });
            this.server.bind(20000);
        });
    }
    stop() {
        return new Promise((resolve, reject) => {
            this.server.close((error) => {
                return error ? reject(error) : resolve();
            });
        });
    }
}

module.exports = { StatsdMock };

if (require.main === module) {
    const mock = new StatsdMock();

    mock.start().catch((error) => {
        console.error(error);
        process.exit(1);
    });
}
