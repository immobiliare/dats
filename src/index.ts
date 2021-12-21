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
enum Types {
    counter = 'c',
    timing = 'ms',
    gauge = 'g',
    set = 's',
}

Object.freeze(Types);

export interface Options {
    host?: string | URL;
    namespace?: string;
    bufferSize?: number;
    bufferFlushTimeout?: number;
    onError?: (error: Error) => void;
    debug?: DebugLoggerFunction;
    udpDnsCache?: boolean;
    udpDnsCacheTTL?: number;
}

/**
 * Statsd Client
 * @alias module:dats.Client
 */
class Client {
    private bufferSize: number;
    private bufferFlushTimeout: number;
    private socket: Socket;
    private buffer: { length: number; data: string };

    private timeout: NodeJS.Timeout;
    private timeoutActive: boolean;

    private host: URL;
    private namespace: string;
    private debug: DebugLogger;
    private isDebug: boolean;

    constructor({
        host,
        namespace = '',
        bufferSize = 0,
        bufferFlushTimeout = 100,
        udpDnsCache = true,
        udpDnsCacheTTL = 120,
        debug = null,
        onError = () => undefined,
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
            hostname: hostname().replace('.', '_'),
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
        if (this.host.protocol === 'tcp:') {
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
    }

    connect(): Promise<boolean> {
        if (!this.socket.isConnected()) return this.socket.connect();
        return Promise.resolve(true);
    }

    private buildMetric(
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

        return metric;
    }
    /**
     * @fires module:dats#error
     */
    private send(metric: string) {
        if (!this.socket.isConnected()) return;
        this.socket.send(metric);
    }
    private refreshTimeout() {
        this.timeoutActive = true;
        this.timeout = this.timeout
            ? this.timeout.refresh()
            : setTimeout(() => this.onTimeout(), this.bufferFlushTimeout);
        this.timeout.unref();
    }
    private onTimeout() {
        this.timeoutActive = false;
        this.flush();
    }

    private push(string: string) {
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
    private flush() {
        this.send(this.buffer.data);
        this.buffer.length = 0;
        this.buffer.data = '';
    }

    private createMetric(
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

    gauge(key: string, value?: number, sampling?: number): void {
        this.createMetric(Types.gauge, key, value, sampling);
    }

    set(key: string, value?: number, sampling?: number): void {
        this.createMetric(Types.set, key, value, sampling);
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
