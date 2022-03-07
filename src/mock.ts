import Dats, { Options } from './index';
import { Socket } from './socket';
import { URL } from 'url';
import { debuglog, DebugLoggerFunction } from 'util';

export default class DatsMock extends Dats {
    constructor(config: Options) {
        super({
            ...config,
            customSocket: new SocketMock(
                new URL('udp://localhost:3000'),
                config.onError
            ),
        });
        this.connect();
    }

    get metrics() {
        return (this.socket as SocketMock).metrics;
    }

    cleanMetrics() {
        (this.socket as SocketMock).cleanMetrics();
    }

    hasSent(regex: RegExp | string): boolean {
        return regex instanceof RegExp
            ? !!this.metrics.find((v) => v.match(regex))
            : this.metrics.includes(regex);
    }
}

export class SocketMock extends Socket {
    private _output: string[];

    constructor(
        url: URL,
        onError: (error: Error) => void = () => undefined,
        debug: DebugLoggerFunction = debuglog('dats')
    ) {
        super(url, onError, debug);
        this.connected = false;
        this._output = [];
    }
    connect(): Promise<boolean> {
        this.connected = true;
        return Promise.resolve(true);
    }
    send(data: string): void {
        if (!this.connected || !data) return;
        this._output.push(...data.split('\n'));
    }
    close(): Promise<void> {
        this.connected = false;
        return Promise.resolve();
    }

    cleanMetrics() {
        this._output = [];
    }

    get metrics() {
        return [...this._output];
    }
}
