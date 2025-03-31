import { createSocket, Socket as SocketUDP, SocketType } from 'dgram';
import net, { Socket as SocketTCP, isIP } from 'net';
import { URL } from 'url';
import buildLookupFunction from './dns-cache';
import { debuglog, DebugLoggerFunction } from 'util';
import EventEmitter, { once } from 'events';
export abstract class Socket extends EventEmitter {
    protected hostname: string;
    protected port: number;
    protected connected: boolean;
    protected debug: typeof console.log;
    protected onError: (error: Error) => void;

    protected constructor(
        url: URL,
        onError: (error: Error) => void = () => undefined,
        debug: DebugLoggerFunction = debuglog('dats')
    ) {
        super();
        if (!url.port) {
            throw new Error('A port is required');
        }
        if (!url.hostname) {
            throw new Error('The hostname is required');
        }

        this.onError = onError.bind(null);
        this.debug = debug;
        this.hostname = url.hostname;
        this.port = parseInt(url.port, 10);
        this.connected = false;
    }

    isConnected(): boolean {
        return this.connected;
    }

    abstract connect(): Promise<boolean>;

    abstract send(data: string): void;

    abstract close(): Promise<void>;
}
export class SocketTcp extends Socket {
    private socket: SocketTCP;
    private reconnectCb: () => void;
    private closing: boolean;
    private connectCalled: boolean;
    private createConnection: typeof net.createConnection;

    constructor(
        url: URL,
        onError?: (error: Error) => void,
        debug?: DebugLoggerFunction,
        createConnection = net.createConnection
    ) {
        super(url, onError, debug);

        this.socket = null;
        this.closing = false;
        this.connectCalled = false;
        this.reconnectCb = () => {
            if (this.closing) return;
            this.connected = false;
            this.debug && this.debug(`dats: Socket reconnecting`);
            setTimeout(() => this._connect().catch(() => undefined), 500);
        };
        this.createConnection = createConnection;
    }

    private _connect() {
        if (this.closing) return Promise.resolve(false);
        if (this.connected) return Promise.resolve(true);
        let resolve;
        let reject;
        const out: Promise<boolean> = new Promise((res, rej) => {
            resolve = res;
            reject = rej;
        });

        this.socket = this.createConnection(this.port, this.hostname, () => {
            resolve(true);
            this.socket.removeListener('error', reject);
            this.connected = true;
        });
        this.socket.setKeepAlive(true);
        this.socket.once('error', reject);
        this.socket.on('error', this.onError);
        // on error is not required because it calls always close
        this.socket.on('close', this.reconnectCb);
        this.socket.on('connect', () => void (this.connected = true));
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
        this.socket.write(data + '\n', (error) => error && this.onError(error));
    }

    close(): Promise<void> {
        if (this.closing) return Promise.resolve();
        this.connected = false;
        this.closing = true;
        this.socket.removeListener('close', this.reconnectCb);
        this.socket.end();
        this.socket.destroy();
        return Promise.resolve();
    }
}

enum UdpTypes {
    udp6 = 6,
    udp4 = 4,
    udp = 4,
}

type IPFamily = 4 | 6;

export class SocketUdp extends Socket {
    private socket: SocketUDP;
    private udpVersion: IPFamily;
    private _pendingMessages: number;
    lookup: (
        _: string,
        __: unknown,
        cb: (
            error?: NodeJS.ErrnoException,
            address?: string,
            family?: 4 | 6
        ) => void
    ) => void;

    constructor(
        url: URL,
        onError?: (error: Error) => void,
        dnsCache = true,
        dnsCacheTTL = 120,
        debug?: DebugLoggerFunction,
        buildLookup = buildLookupFunction
    ) {
        super(url, onError, debug);
        this.socket = null;
        this._pendingMessages = 0;
        // Removed parenthesis if host name is ipv6 IP.
        if (this.hostname.startsWith('[') && this.hostname.endsWith(']')) {
            /* istanbul ignore next */
            this.hostname = this.hostname.substring(
                1,
                this.hostname.length - 1
            );
        }

        this.udpVersion = isIP(this.hostname) as IPFamily;

        this.udpVersion =
            (this.udpVersion ||
                UdpTypes[url.protocol?.slice(0, url?.protocol.length - 1)]) ??
            4;

        this.lookup = dnsCache ? buildLookup(dnsCacheTTL, this.hostname) : null;
    }

    get pendingMessages() {
        return this._pendingMessages;
    }
    get idle() {
        return this._pendingMessages === 0;
    }

    connect(): Promise<boolean> {
        this.socket = createSocket({
            type: `udp${this.udpVersion}` as SocketType,
            lookup:
                !isIP(this.hostname) && this.lookup ? this.lookup : undefined,
        });
        this.socket.on('error', (err) => err && this.onError(err));
        this.connected = true;
        this.socket.unref();
        return Promise.resolve(true);
    }

    send(data: string): void {
        if (!this.connected || !data) return;
        this._pendingMessages += 1;
        return this.socket.send(data, this.port, this.hostname, (err) => {
            if (this._pendingMessages) {
                this._pendingMessages -= 1;
            }
            if (err) {
                try {
                    this.onError(err);
                } catch (e) {
                    this.debug('Exception on this.onError function', e);
                }
            }
            if (this._pendingMessages === 0) {
                this.emit('idle');
            }
        });
    }

    async close(): Promise<void> {
        if (!this.connected) return;
        if (!this.idle) {
            await once(this, 'idle');
        }
        await new Promise((res) => {
            this.socket.close(res as () => void);
            this.connected = false;
        });
    }
}
