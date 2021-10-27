import { lookup as defaultLookup } from 'dns';

export default function buildLookupFunction(
    time2live: number,
    hostname: string,
    lookup = defaultLookup
): (
    hostname: string,
    family: unknown,
    cb: (
        error?: NodeJS.ErrnoException | null,
        address?: string,
        family?: 4 | 6
    ) => void
) => void {
    const ttl = time2live * 1000;

    let currentIP = null;
    let timestamp = null;
    return (
        _: string,
        family: 4 | 6,
        cb: (
            error?: NodeJS.ErrnoException | null,
            address?: string,
            family?: 4 | 6
        ) => void
    ): void => {
        const now = Date.now();
        if (currentIP && now - timestamp < ttl) {
            return cb(undefined, currentIP, family);
        }

        lookup(hostname, family, (err, address) => {
            if (err) return void cb(err);
            currentIP = address;
            timestamp = now;
            cb(err, currentIP, family);
        });
    };
}
