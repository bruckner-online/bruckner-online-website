/**
 * Uploads Lexikon images to the bucket that imgproxy reads from.
 *
 *   pnpm images:upload <directory> [--max-megapixels 50] [--force] [--dry-run]
 *
 * Object keys are the paths below <directory>, e.g. `notenbeispiele/Example.png`, matching the
 * paths below `/bilder_ablo/` on the previous site. Only image files are uploaded (no `Thumbs.db`).
 *
 * Images above the resolution limit of imgproxy are downscaled to fit, keeping key and format.
 * Each object stores the SHA-256 of its source file and the resolution limit, so later runs skip
 * files that are unchanged and were uploaded with the same limit.
 *
 * Reads S3_ACCESS_KEY, S3_BUCKET_NAME, S3_HOST, S3_PORT, S3_PROTOCOL, and S3_SECRET_KEY from the
 * environment or `.env.local`.
 */
import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { extname, join } from "node:path";
import { parseArgs } from "node:util";

import { log } from "@acdh-oeaw/lib";
import { Client, S3Error } from "minio";
import sharp from "sharp";

import { contentTypes, imageExtensions, s3Config } from "./config.ts";
import { capResolution, defaultMaxMegapixels } from "./resolution.ts";

const { positionals, values } = parseArgs({
	allowPositionals: true,
	options: {
		"dry-run": { type: "boolean", default: false },
		force: { type: "boolean", default: false },
		"max-megapixels": { type: "string", default: String(defaultMaxMegapixels) },
	},
});

const directory = positionals[0];
if (directory == null) {
	log.error("Usage: pnpm images:upload <directory> [--max-megapixels 50] [--force] [--dry-run]");
	process.exit(1);
}
const maxMegapixels = Number(values["max-megapixels"]);
const dryRun = values["dry-run"];

const keys = readdirSync(directory, { recursive: true, encoding: "utf8" })
	.filter((name) => {
		return imageExtensions.test(name);
	})
	.map((name) => {
		return name.split("\\").join("/");
	})
	.sort();

// Article markup percent-encodes NFC file names, and imgproxy uses object keys as given.
const unnormalized = keys.filter((key) => {
	return key !== key.normalize("NFC");
});
if (unnormalized.length > 0) {
	log.error(`File names must be NFC-normalized:\n${unnormalized.join("\n")}`);
	process.exit(1);
}

const { bucketName, ...connection } = s3Config();
const client = new Client(connection);

if (!(await client.bucketExists(bucketName))) {
	if (dryRun) {
		log.warn(`Bucket ${bucketName} does not exist.`);
	} else {
		await client.makeBucket(bucketName);
		log.info(`Created bucket ${bucketName}`);
	}
}

/** Identifies the source file and processing of an uploaded object. */
function version(hash: string): string {
	return `${hash};max-megapixels=${String(maxMegapixels)}`;
}

async function storedVersion(key: string): Promise<string | null> {
	try {
		const { metaData } = await client.statObject(bucketName, key);
		return (metaData["source-version"] as string | undefined) ?? null;
	} catch (error) {
		if (error instanceof S3Error && error.code === "NotFound") {
			return null;
		}
		throw error;
	}
}

let uploaded = 0;
let skipped = 0;
let resized = 0;

log.info(
	`${dryRun ? "Checking" : "Uploading"} ${String(keys.length)} images to ${bucketName} at ${connection.endPoint}`,
);

for (const key of keys) {
	const source = readFileSync(join(directory, key));
	const hash = createHash("sha256").update(source).digest("hex");

	if (!values.force && (await storedVersion(key)) === version(hash)) {
		skipped++;
		continue;
	}

	let body = source;
	const { width, height, format } = await sharp(source, { limitInputPixels: false }).metadata();
	const capped = capResolution(width, height, maxMegapixels);
	if (capped != null) {
		const image = sharp(source, { limitInputPixels: false }).resize(capped.width, capped.height, {
			fit: "fill",
		});
		body = await (
			format === "jpeg"
				? image.jpeg({ quality: 90, mozjpeg: true })
				: image.png({ compressionLevel: 9 })
		).toBuffer();
		resized++;
		log.info(
			`Downscaled ${key}: ${String(width)}×${String(height)} → ${String(capped.width)}×${String(capped.height)}`,
		);
	}

	if (!dryRun) {
		await client.putObject(bucketName, key, body, body.length, {
			"Content-Type":
				contentTypes[extname(key).slice(1).toLowerCase()] ?? "application/octet-stream",
			"source-version": version(hash),
		});
	}
	uploaded++;
}

log.success(
	`${dryRun ? "Would upload" : "Uploaded"} ${String(uploaded)} (${String(resized)} downscaled), skipped ${String(skipped)} unchanged.`,
);
