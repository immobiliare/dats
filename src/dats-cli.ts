import { parseArgs } from 'util';
import Client, { Types } from './index';

const TYPES = Object.keys(Types);

type Options = {
    [k: string]: {
        type: string;
        default?: string | boolean;
        help?: string;
        validate?: (v: any) => boolean;
    };
};

const options: Options = {
    host: {
        type: 'string',
        validate: (v) => Boolean(v),
    },
    port: {
        type: 'string',
        validate: (v) => Boolean(v) && isFinite(v),
    },
    // metric
    type: {
        type: 'string',
        help: 'Metric type can be one of: ' + TYPES.join(', '),
        validate: (v) => Boolean(v) && TYPES.includes(v),
    },
    namespace: {
        type: 'string',
        help: 'Metric full namespace, use dots `.` to separate metrics',
        validate: (v) => Boolean(v),
    },
    value: {
        type: 'string',
        help: 'Metric value',
        validate: (v) => Boolean(v),
    },
    help: {
        type: 'boolean',
    },
};

function validateRequiredValues(values, opts: Options) {
    let valid = true;
    for (const [k, opt] of Object.entries(opts)) {
        if (
            typeof opt?.validate === 'function' &&
            !opt?.validate(values?.[k])
        ) {
            valid = false;
            console.log('🚨 Wrong input flag: `%s`', k);
        }
    }
    if (!valid) console.log('ℹ️  Run with `--help` for more info');
    return valid;
}

function printHelp({ help, ...opts }: Options) {
    console.log(
        'ℹ️  The following are required input flags: \n\n%s\n\nIf unsure of output run the command prepended with `DRY_RUN=1`',
        Object.entries(opts)
            .map(([k, v]) => `\t--${k} {${v.type}} [${v?.help || ''}]`)
            .join('\n')
    );
    return process.exit(0);
}

const { values } = parseArgs({ options } as any);

if (values.help) {
    printHelp(options);
}

if (!validateRequiredValues(values, options)) {
    process.exit(1);
}

const { host, port, type, value, namespace } = values;

const client = new Client({
    host: new URL(`udp://${host}:${port}`),
});

if (!process.env.DRY_RUN) {
    client[type as string](namespace, value);
} else {
    console.log(`[dry-run]: ${namespace}:${value}|${Types[type as string]}`);
}
