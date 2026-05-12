import { createSocket, SocketType, Socket as SocketUDP } from "node:dgram";
import EventEmitter, { once } from "node:events";
import net, { isIP, Socket as SocketTCP } from "node:net";
import { URL } from "node:url";
import { DebugLoggerFunction, debuglog } from "node:util";
import buildLookupFunction from "./dns-cache.js";

/**
 * @emits idle The socket has no more pending messages. We use this event
 * to be sure the socket is not active anymore before closing it.
 */
export abstract class Socket extends EventEmitter {
  protected hostname: string;
  protected port: number;
  protected connected: boolean;
  protected debug: typeof console.log;
  protected onError: (error: Error) => void;
  protected _pendingMessages: number;
  protected closeTimeout: number;

  protected constructor(
    url: URL,
    onError: (error: Error) => void = () => undefined,
    debug: DebugLoggerFunction = debuglog("dats"),
  ) {
    super();
    if (!url.port) {
      throw new Error("A port is required");
    }
    if (!url.hostname) {
      throw new Error("The hostname is required");
    }

    this._pendingMessages = 0;
    this.onError = onError.bind(null);
    this.debug = debug;
    this.hostname = url.hostname;
    this.port = Number.parseInt(url.port, 10);
    this.connected = false;
    this.closeTimeout = 5000;
  }

  isConnected(): boolean {
    return this.connected;
  }

  /**
   * Number of messages that are still being sent.
   */
  get pendingMessages() {
    return this._pendingMessages;
  }
  /**
   * Whether the socket has pending messages or not.
   * Used to check if the socket is still active.
   */
  get idle() {
    return this._pendingMessages === 0;
  }

  abstract connect(): Promise<boolean>;

  abstract send(data: string): void;

  abstract close(): Promise<void>;
}
export class SocketTcp extends Socket {
  private socket!: SocketTCP;
  private reconnectCb: () => void;
  private closing: boolean;
  private connectCalled: boolean;
  private createConnection: typeof net.createConnection;

  constructor(
    url: URL,
    onError?: (error: Error) => void,
    debug?: DebugLoggerFunction,
    createConnection = net.createConnection,
  ) {
    super(url, onError, debug);

    this.closing = false;
    this.connectCalled = false;
    this.reconnectCb = () => {
      if (this.closing) return;
      this.connected = false;
      this.debug?.("dats: Socket reconnecting");
      setTimeout(() => this._connect().catch(() => undefined), 500);
    };
    this.createConnection = createConnection;
  }

  private _connect() {
    if (this.closing) return Promise.resolve(false);
    if (this.connected) return Promise.resolve(true);
    let resolve!: (v: boolean) => void;
    let reject!: (e: Error) => void;
    const out: Promise<boolean> = new Promise((res, rej) => {
      resolve = res;
      reject = rej;
    });

    this.socket = this.createConnection(this.port, this.hostname, () => {
      resolve(true);
      this.socket.removeListener("error", reject);
      this.connected = true;
    });
    this.socket.setKeepAlive(true);
    this.socket.once("error", reject);
    this.socket.on("error", this.onError);
    // on error is not required because it calls always close
    this.socket.on("close", this.reconnectCb);
    this.socket.on("connect", () => {
      this.connected = true;
    });
    this.socket.unref();
    return out;
  }

  connect(): Promise<boolean> {
    if (this.connectCalled) return Promise.resolve(false);
    this.connectCalled = true;
    return this._connect().catch((e) => {
      this.close();
      return Promise.reject(e);
    });
  }

  send(data: string): void {
    if (!this.connected || !data) return;
    this._pendingMessages += 1;
    this.socket.write(`${data}\n`, (err) => {
      if (this._pendingMessages) {
        this._pendingMessages -= 1;
      }
      if (err) {
        try {
          this.onError(err);
        } catch (e) {
          this.debug("Exception on this.onError function", e);
        }
      }
      if (this._pendingMessages === 0) {
        this.emit("idle");
      }
    });
  }

  async close(): Promise<void> {
    if (this.closing) return Promise.resolve();
    this.closing = true;
    if (!this.idle) {
      await Promise.race([
        once(this, "idle"),
        new Promise((resolve) => setTimeout(resolve, this.closeTimeout)),
      ]);
    }
    this.connected = false;
    this.socket.removeListener("close", this.reconnectCb);
    this.socket.end();
    this.socket.destroy();
  }
}

enum UdpTypes {
  udp6 = 6,
  udp4 = 4,
  udp = 4,
}

type IPFamily = 4 | 6;

type LookupFn = (
  _: string,
  __: 4 | 6,
  cb: (
    error?: NodeJS.ErrnoException | null,
    address?: string,
    family?: 4 | 6,
  ) => void,
) => void;

export class SocketUdp extends Socket {
  private socket!: SocketUDP;
  private udpVersion: IPFamily;
  lookup: LookupFn | undefined;

  constructor(
    url: URL,
    onError?: (error: Error) => void,
    dnsCache = true,
    dnsCacheTTL = 120,
    debug?: DebugLoggerFunction,
    buildLookup = buildLookupFunction,
  ) {
    super(url, onError, debug);
    // Removed parenthesis if host name is ipv6 IP.
    if (this.hostname.startsWith("[") && this.hostname.endsWith("]")) {
      /* istanbul ignore next */
      this.hostname = this.hostname.substring(1, this.hostname.length - 1);
    }

    this.udpVersion = isIP(this.hostname) as IPFamily;

    const protocolKey = url.protocol?.slice(0, url?.protocol.length - 1);
    this.udpVersion =
      (this.udpVersion || UdpTypes[protocolKey as keyof typeof UdpTypes]) ?? 4;

    this.lookup = dnsCache
      ? buildLookup(dnsCacheTTL, this.hostname)
      : undefined;
  }

  connect(): Promise<boolean> {
    this.socket = createSocket({
      type: `udp${this.udpVersion}` as SocketType,
      lookup:
        !isIP(this.hostname) && this.lookup
          ? (this.lookup as unknown as Parameters<
              typeof createSocket
            >[0] extends { lookup?: infer L }
              ? NonNullable<L>
              : never)
          : undefined,
    });
    this.socket.on("error", (err) => err && this.onError(err));
    this.connected = true;
    this.socket.unref();
    return Promise.resolve(true);
  }

  send(data: string): void {
    if (!this.connected || !data) return;
    this._pendingMessages += 1;
    this.socket.send(data, this.port, this.hostname, (err) => {
      if (this._pendingMessages) {
        this._pendingMessages -= 1;
      }
      if (err) {
        try {
          this.onError(err);
        } catch (e) {
          this.debug("Exception on this.onError function", e);
        }
      }
      if (this._pendingMessages === 0) {
        this.emit("idle");
      }
    });
  }

  async close(): Promise<void> {
    if (!this.connected) return;
    if (!this.idle) {
      await Promise.race([
        once(this, "idle"),
        new Promise((resolve) => setTimeout(resolve, this.closeTimeout)),
      ]);
    }
    await new Promise((res) => {
      this.socket.close(res as () => void);
      this.connected = false;
    });
  }
}
