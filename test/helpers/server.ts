import dgram, { Socket } from 'dgram';
import EventEmitter from 'events';
import { AddressInfo } from 'net';

export default class StatsdMock extends EventEmitter {
    private server: Socket;
    constructor(version: 4 | 6 = 4) {
        super();
        this.server = dgram.createSocket(`udp${version}`);
    }
    start(): Promise<AddressInfo> {
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
            this.server.bind(0);
        });
    }
    stop(): Promise<null> {
        return new Promise((resolve) => {
            // Here, The close method in the old code takes as input the error, but is always undefined
            this.server.close(() => {
                resolve(null);
            });
        });
    }
}
