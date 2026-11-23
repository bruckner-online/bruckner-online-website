/**
 * Requests every image below a directory through imgproxy, at the widths articles use, and
 * reports failures and slow responses. Run after uploading with `pnpm images:upload`.
 *
 *   pnpm images:check <directory>
 *
 * Reads IMGPROXY_BASE_URL, IMGPROXY_KEY, IMGPROXY_SALT, and S3_BUCKET_NAME from the environment or
 * `.env.local`.
 */
import { readdirSync } from "node:fs";
import { parseArgs } from "node:util";

import { log } from "@acdh-oeaw/lib";

import { createImgproxyUrl } from "../../lib/imgproxy.ts";
import { imageExtensions, imgproxyConfig } from "./config.ts";

const { positionals, values } = parseArgs({
	allowPositionals: true,
	options: {
		concurrency: { type: "string", default: "4" },
		width: { type: "string", default: "960" },
	},
});

const directory = positionals[0];
if (directory == null) {
	log.error("Usage: pnpm images:check <directory> [--width 960] [--concurrency 4]");
	process.exit(1);
}

const config = imgproxyConfig();
const imgproxyUrl = createImgproxyUrl(config);
const width = Number(values.width);
const keys = readdirSync(directory, { recursive: true, encoding: "utf8" })
	.filter((name) => {
		return imageExtensions.test(name);
	})
	.map((name) => {
		return name.split("\\").join("/");
	})
	.sort();

log.info(`Checking ${String(keys.length)} images at ${String(width)}w via ${config.baseUrl}`);

interface Outcome {
	key: string;
	status: number | string;
	type: string | null;
	bytes: number;
	ms: number;
}

const outcomes: Array<Outcome> = [];
let next = 0;

async function worker(): Promise<void> {
	while (next < keys.length) {
		const key = keys[next++]!;
		const start = performance.now();
		try {
			const response = await fetch(imgproxyUrl(key, { width }), {
				headers: { accept: "image/webp,*/*" },
				signal: AbortSignal.timeout(120_000),
			});
			const body = await response.arrayBuffer();
			outcomes.push({
				key,
				status: response.status,
				type: response.headers.get("content-type"),
				bytes: body.byteLength,
				ms: performance.now() - start,
			});
		} catch (error) {
			outcomes.push({
				key,
				status: String(error),
				type: null,
				bytes: 0,
				ms: performance.now() - start,
			});
		}
		process.stdout.write(".");
	}
}

await Promise.all(
	Array.from({ length: Number(values.concurrency) }, () => {
		return worker();
	}),
);
process.stdout.write("\n");

const failures = outcomes.filter((outcome) => {
	return outcome.status !== 200;
});
const slowest = outcomes.toSorted((a, b) => {
	return b.ms - a.ms;
});
const total = outcomes.reduce((sum, outcome) => {
	return sum + outcome.bytes;
}, 0);
const types = new Map<string, number>();
for (const outcome of outcomes) {
	const type = outcome.type ?? "(none)";
	types.set(type, (types.get(type) ?? 0) + 1);
}

log.info(`Total output: ${(total / 1e6).toFixed(1)} MB`);
for (const [type, count] of types) {
	log.info(`  ${type}: ${String(count)}`);
}
log.info("Slowest:");
for (const outcome of slowest.slice(0, 5)) {
	log.info(`  ${(outcome.ms / 1000).toFixed(1)} s  ${outcome.key}`);
}

if (failures.length > 0) {
	log.error(`${String(failures.length)} failed:`);
	for (const failure of failures) {
		log.error(`  ${String(failure.status)}  ${failure.key}`);
	}
	process.exit(1);
}
log.success("All images processed.");
