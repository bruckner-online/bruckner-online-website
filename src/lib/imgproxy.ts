import { createHmac } from "node:crypto";

export interface ImgproxyConfig {
	/** Public URL of the imgproxy instance. */
	baseUrl: string;
	/** Hex-encoded signing key, shared with imgproxy (`IMGPROXY_KEY`). */
	key: string;
	/** Hex-encoded signing salt, shared with imgproxy (`IMGPROXY_SALT`). */
	salt: string;
	/** S3 bucket that imgproxy reads source images from. */
	bucketName: string;
}

export interface ImgproxyOptions {
	/** Maximum output width. Images are never enlarged. */
	width: number;
	/** Maximum output height; `0` scales the height proportionally. */
	height?: number;
}

export type ImgproxyUrl = (key: string, options: ImgproxyOptions) => string;

/**
 * Creates signed imgproxy URLs for object keys.
 *
 * Without an extension, imgproxy picks WebP when the `Accept` header allows it and
 * `IMGPROXY_AUTO_WEBP` is enabled, and otherwise keeps the source format.
 *
 * @see https://docs.imgproxy.net/usage/signing_url
 */
export function createImgproxyUrl(config: ImgproxyConfig): ImgproxyUrl {
	const key = Buffer.from(config.key, "hex");
	const salt = Buffer.from(config.salt, "hex");
	const baseUrl = config.baseUrl.replace(/\/+$/, "");

	return function imgproxyUrl(objectKey, { width, height = 0 }) {
		// imgproxy uses the S3 object key as given: it must not be percent-encoded.
		const source = `s3://${config.bucketName}/${objectKey}`;
		const path = `/rs:fit:${String(width)}:${String(height)}/${Buffer.from(source).toString("base64url")}`;
		const signature = createHmac("sha256", key).update(salt).update(path).digest("base64url");
		return `${baseUrl}/${signature}${path}`;
	};
}
