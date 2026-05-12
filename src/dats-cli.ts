#!/usr/bin/env node

import { readFileSync } from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import Client, { Types } from "./index.js";

function getFileConfigs(): Partial<CliOptions> {
  try {
    const res = JSON.parse(
      readFileSync(path.resolve(process.cwd(), ".datsrc"), "utf-8"),
    );
    return res;
  } catch {
    return {};
  }
}

const TYPES = Object.keys(Types);

type CliOptions = {
  [k: string]: {
    type: string;
    default?: string | boolean;
    help?: string;
    short?: string;
    validate?: (v: unknown) => boolean;
  };
};

const options: CliOptions = {
  host: {
    type: "string",
    validate: (v) => Boolean(v),
  },
  port: {
    type: "string",
    validate: (v) => {
      const n = Number(v);
      return Number.isFinite(n) && n >= 1 && n <= 65535;
    },
  },
  // metric
  type: {
    type: "string",
    help: `Metric type can be one of: ${TYPES.join(", ")}`,
    validate: (v) => Boolean(v) && TYPES.includes(v as string),
  },
  prefix: {
    type: "string",
    help: "Metric prefix",
  },
  namespace: {
    type: "string",
    help: "Metric full namespace, use dots `.` to separate metrics",
    validate: (v) => Boolean(v),
  },
  value: {
    type: "string",
    help: "Metric value",
    validate: (v) => Boolean(v),
  },
  // utilities
  quiet: {
    type: "boolean",
    help: "Suppress all console output",
    short: "q",
  },
  "dry-run": {
    type: "boolean",
    help: "Metric wont be sent, use for debug",
    short: "d",
  },
  help: {
    type: "boolean",
    short: "h",
  },
};

function validate(values: Record<string, unknown>, opts: CliOptions) {
  let valid = true;
  for (const [k, opt] of Object.entries(opts)) {
    if (typeof opt?.validate === "function" && !opt?.validate(values?.[k])) {
      valid = false;
      console.log("🚨 Wrong input flag: `%s`", k);
    }
  }
  if (!valid) console.log("ℹ️  Run with `--help` for more info");
  return valid;
}

function printHelp({ ...opts }: CliOptions) {
  console.log(
    "ℹ️  The following are required input flags: \n\n%s\n\nIf unsure of output run the command prepended with `DRY_RUN=1`",
    Object.entries(opts)
      .map(([k, v]) => `\t--${k} {${v.type}} [${v?.help || ""}]`)
      .join("\n"),
  );
  return process.exit(0);
}

const parseArgsOptions = Object.fromEntries(
  Object.entries(options).map(([k, v]) => [
    k,
    { type: v.type as "string" | "boolean", short: v.short },
  ]),
);

const { values } = parseArgs({ options: parseArgsOptions });

if (values.quiet) {
  console.log = () => undefined;
  console.error = () => undefined;
}

if (values.help) {
  printHelp(options);
}

const configurations: Record<string, unknown> = {
  ...getFileConfigs(),
  ...values,
};

if (!validate(configurations, options)) {
  process.exit(1);
}

const {
  host,
  port,
  type,
  value,
  prefix,
  namespace,
  "dry-run": dryRun,
  quiet,
} = configurations;

const ns = [prefix, namespace].filter(Boolean).join(".");

const client = new Client({
  host: new URL(`udp://${host}:${port}`),
});

if (dryRun) {
  console.log("[dry run]: Metric wont be sent");
} else {
  (client as unknown as Record<string, (ns: string, value: unknown) => void>)[
    type as string
  ](ns, value);
}

// Usefull for debugging CI logs
if (!quiet) {
  console.log(
    `Sent metric: ${ns}:${value}|${Types[type as keyof typeof Types]}`,
  );
}
