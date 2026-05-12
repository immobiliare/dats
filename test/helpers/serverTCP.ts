import EventEmitter from "events";
import { AddressInfo, createServer, Server, Socket } from "net";

export default class StatsdMock extends EventEmitter {
  private server!: Server;
  private sockets: Socket[];
  private stopped = false;
  constructor() {
    super();
    this.sockets = [];
  }
  start(): Promise<AddressInfo | string | null> {
    return new Promise((resolve, reject) => {
      this.server = createServer((socket) => {
        socket.on("data", (msg) => {
          this.emit("metric", msg);
        });
        this.sockets.push(socket);
      });

      const onError = (error: Error) => reject(error);

      const onDone = () => {
        this.server.removeListener("error", onError);
        return resolve(this.server.address());
      };
      this.server.once("listening", onDone);
      this.server.once("error", onError);
      this.server.listen(0);
    });
  }

  disconnectSocket(): void {
    for (const sock of this.sockets) {
      sock.destroy();
    }
  }

  stop(): Promise<null> {
    if (this.stopped) return Promise.resolve(null);
    this.stopped = true;
    this.disconnectSocket();
    if (!this.server?.listening) return Promise.resolve(null);
    return new Promise((resolve) => {
      this.server.close(() => {
        resolve(null);
      });
    });
  }
}
