import * as v from "valibot";

import type { ImgproxyConfig } from "../../lib/imgproxy.ts";

export const imageExtensions = /\.(?:gif|jpe?g|png)$/i;

export const contentTypes: Record<string, string> = {
	gif: "image/gif",
	jpeg: "image/jpeg",
	jpg: "image/jpeg",
	png: "image/png",
};

function parse<TSchema extends v.GenericSchema>(schema: TSchema): v.InferOutput<TSchema> {
	const result = v.safeParse(schema, process.env);
	if (!result.success) {
		throw new Error(`Invalid or missing environment variables.\n${v.summarize(result.issues)}`);
	}
	return result.output;
}

/** S3 settings, named as in other ACDH projects. */
export function s3Config() {
	const env = parse(
		v.object({
			S3_ACCESS_KEY: v.pipe(v.string(), v.nonEmpty()),
			S3_BUCKET_NAME: v.pipe(v.string(), v.nonEmpty()),
			S3_HOST: v.pipe(v.string(), v.nonEmpty()),
			S3_PORT: v.pipe(v.string(), v.toNumber(), v.integer(), v.minValue(1)),
			S3_PROTOCOL: v.optional(v.picklist(["http", "https"]), "https"),
			S3_SECRET_KEY: v.pipe(v.string(), v.nonEmpty()),
		}),
	);
	return {
		accessKeyId: env.S3_ACCESS_KEY,
		bucketName: env.S3_BUCKET_NAME,
		endpoint: `${env.S3_PROTOCOL}://${env.S3_HOST}:${String(env.S3_PORT)}`,
		secretAccessKey: env.S3_SECRET_KEY,
	};
}

/** imgproxy settings, as used by the website. */
export function imgproxyConfig(): ImgproxyConfig {
	const env = parse(
		v.object({
			IMGPROXY_BASE_URL: v.pipe(v.string(), v.url()),
			IMGPROXY_KEY: v.pipe(v.string(), v.hexadecimal()),
			IMGPROXY_SALT: v.pipe(v.string(), v.hexadecimal()),
			S3_BUCKET_NAME: v.pipe(v.string(), v.nonEmpty()),
		}),
	);
	return {
		baseUrl: env.IMGPROXY_BASE_URL,
		key: env.IMGPROXY_KEY,
		salt: env.IMGPROXY_SALT,
		bucketName: env.S3_BUCKET_NAME,
	};
}
