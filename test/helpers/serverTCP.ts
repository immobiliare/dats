import EventEmitter from 'events';
import { AddressInfo, Socket, createServer, Server } from 'net';

export default class StatsdMock extends EventEmitter {
    private server: Server;
    private sockets: Socket[];
    constructor() {
        super();
        this.server = null;
        this.sockets = [];
    }
    start(): Promise<AddressInfo | string | null> {
        return new Promise((resolve, reject) => {
            this.server = createServer((socket) => {
                socket.on('data', (msg) => {
                    this.emit('metric', msg);
                });
                this.sockets.push(socket);
            });

            const onError = (error) => reject(error);

            const onDone = () => {
                this.server.removeListener('error', onError);
                return resolve(this.server.address());
            };
            this.server.once('listening', onDone);
            this.server.once('error', onError);
            this.server.listen(0);
        });
    }

    disconnectSocket() {
        for (let sock of this.sockets) {
            sock.destroy();
        }
    }

    stop() {
        return new Promise((resolve, reject) => {
            // Here, The close method in the old code takes as input the error, but is always undefined
            this.disconnectSocket();
            this.server.close(() => {
                resolve(null);
            });
        });
    }
}
