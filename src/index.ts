import { hostname } from 'os';
import { URL } from 'url';
import { SocketTcp, SocketUdp, Socket } from './socket';
import { debuglog, DebugLoggerFunction } from 'util';

interface DebugLogger extends DebugLoggerFunction {
    enabled?: boolean;
}

/**
 * Enum of metrics types
 * @see https://github.com/statsd/statsd/blob/master/docs/metric_types.md
 */
export enum Types {
    counter = 'c',
    timing = 'ms',
    gauge = 'g',
    set = 's',
}

Object.freeze(Types);

export type Tags = { [key: string]: string } | string[];

export interface Options {
    host?: string | URL;
    namespace?: string;
    bufferSize?: number;
    bufferFlushTimeout?: number;
    onError?: (error: Error) => void;
    debug?: DebugLoggerFunction;
    udpDnsCache?: boolean;
    udpDnsCacheTTL?: number;
    customSocket?: Socket;
    tags?: Tags;
}

/**
 * Statsd Client
 * @alias module:dats.Client
 */
class Client {
    protected bufferSize: number;
    protected bufferFlushTimeout: number;
    protected socket: Socket;
    protected buffer: { length: number; data: string };

    protected timeout: NodeJS.Timeout;
    protected timeoutActive: boolean;

    protected host: URL;
    protected namespace: string;
    protected debug: DebugLogger;
    protected isDebug: boolean;
    protected tags: string;

    constructor({
        host,
        namespace = '',
        bufferSize = 0,
        bufferFlushTimeout = 100,
        udpDnsCache = true,
        udpDnsCacheTTL = 120,
        debug = null,
        onError = () => undefined,
        customSocket = null,
        tags = null,
    }: Options = {}) {
        if (typeof namespace !== 'string') {
            throw new Error('A namespace string is required');
        }
        if (typeof bufferSize !== 'number' || bufferSize < 0) {
            throw new Error('bufferSize must be a number >= 0');
        }
        if (typeof bufferFlushTimeout !== 'number' || bufferFlushTimeout <= 0) {
            throw new Error('bufferFlushTimeout must be a number > 0');
        }
        namespace = namespace.replace(/^\.+/, '');
        const vars = {
            hostname: hostname().replace(/\./g, '_'),
            pid: process.pid,
        };
        this.host = host instanceof URL ? host : new URL(host);

        if (!this.host.port) {
            throw new Error('A port is required');
        }

        this.isDebug = false;

        this.debug = debuglog('dats', (logger) => {
            this.debug = logger;
        });

        this.isDebug = this.debug.enabled;
        if (this.isDebug && debug) this.debug = debug;

        this.debug('Debug mode active');

        this.namespace = namespace.replace(
            /\$\{(hostname|pid)\}/g,
            (_, p) => vars[p]
        );
        if (this.namespace !== '') {
            this.namespace += '.';
        }

        if (customSocket) {
            this.socket = customSocket;
        } else if (this.host.protocol === 'tcp:') {
            this.socket = new SocketTcp(this.host, onError, this.debug);
        } else {
            this.socket = new SocketUdp(
                this.host,
                onError,
                udpDnsCache,
                udpDnsCacheTTL,
                this.debug
            );
            this.socket.connect();
        }
        this.bufferSize = bufferSize;
        this.buffer = {
            length: 0,
            data: '',
        };
        this.bufferFlushTimeout = bufferFlushTimeout;
        this.timeout = null;
        this.timeoutActive = false;
        if (tags) {
            if (Array.isArray(tags)) {
                this.tags = tags.join(',');
            } else {
                this.tags = Object.keys(tags)
                    .map((tag) => `${tag}:${tags[tag]}`)
                    .join(',');
            }
        }
    }

    connect(): Promise<boolean> {
        if (!this.socket.isConnected()) return this.socket.connect();
        return Promise.resolve(true);
    }

    protected buildMetric(
        type: Types,
        key: string,
        value?: number,
        sampling?: number
    ): string {
        if (Types.counter === type) {
            value = value || 1;
        }

        let metric = this.namespace + key + ':' + value + '|' + type;
        if (sampling && (Types.timing === type || Types.counter === type)) {
            metric += '|@' + sampling;
        }

        if (this.tags) {
            metric += `|#${this.tags}`;
        }

        return metric;
    }
    /**
     * @fires module:dats#error
     */
    protected send(metric: string) {
        if (!this.socket.isConnected()) return;
        this.socket.send(metric);
    }
    protected refreshTimeout() {
        this.timeoutActive = true;
        this.timeout = this.timeout
            ? this.timeout.refresh()
            : setTimeout(() => this.onTimeout(), this.bufferFlushTimeout);
        this.timeout.unref();
    }
    protected onTimeout() {
        this.timeoutActive = false;
        this.flush();
    }

    protected push(string: string) {
        const chunk = this.buffer.data === '' ? string : `\n${string}`;
        const l = Buffer.byteLength(chunk);
        if (l + this.buffer.length > this.bufferSize) {
            this.flush();
        }
        if (!this.timeoutActive) {
            this.refreshTimeout();
        }
        this.buffer.data += chunk;
        this.buffer.length += l;
    }
    /**
     * Flush the buffer batch
     */
    protected flush() {
        this.send(this.buffer.data);
        this.buffer.length = 0;
        this.buffer.data = '';
    }

    protected createMetric(
        type: Types,
        key: string,
        value?: number,
        sampling?: number
    ) {
        /* istanbul ignore next */
        if (this.isDebug && Types.timing === type && !Number.isInteger(value))
            this.debug(
                `${key} has not an integer value, the passed value is: ${value}`
            );
        const metric = this.buildMetric(type, key, value, sampling);
        if (this.bufferSize === 0) {
            this.send(metric);
        } else {
            this.push(metric);
        }
    }

    // Public methods
    getSupportedTypes(): typeof Types {
        return Types;
    }

    counter(key: string, value?: number, sampling?: number): void {
        this.createMetric(Types.counter, key, value, sampling);
    }

    gauge(key: string, value?: number): void {
        this.createMetric(Types.gauge, key, value);
    }

    set(key: string, value?: number): void {
        this.createMetric(Types.set, key, value);
    }

    timing(key: string, value?: number, sampling?: number): void {
        this.createMetric(Types.timing, key, value, sampling);
    }

    /**
     * Close the client connection.
     * @returns {Promise} if no callback is passed
     */
    close(done?: () => void): Promise<void> | NodeJS.Immediate | void {
        const hasCallback = typeof done === 'function';
        if (!this.socket.isConnected()) {
            return hasCallback ? setImmediate(done) : Promise.resolve();
        }
        return hasCallback
            ? this.socket.close().then(done)
            : this.socket.close();
    }
}

export default Client;
