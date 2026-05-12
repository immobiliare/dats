import { lookup as defaultLookup } from "node:dns";

export default function buildLookupFunction(
  time2live: number,
  hostname: string,
  lookup = defaultLookup,
): (
  hostname: string,
  family: 4 | 6,
  cb: (
    error?: NodeJS.ErrnoException | null,
    address?: string,
    family?: 4 | 6,
  ) => void,
) => void {
  const ttl = time2live * 1000;

  let currentIP: string | null = null;
  let timestamp: number | null = null;
  return (
    _: string,
    family: 4 | 6,
    cb: (
      error?: NodeJS.ErrnoException | null,
      address?: string,
      family?: 4 | 6,
    ) => void,
  ): void => {
    const now = Date.now();
    if (currentIP && timestamp !== null && now - timestamp < ttl) {
      cb(undefined, currentIP, family);
      return;
    }

    lookup(hostname, family, (err, address) => {
      if (err) return void cb(err);
      currentIP = address;
      timestamp = now;
      cb(err, currentIP, family);
    });
  };
}
