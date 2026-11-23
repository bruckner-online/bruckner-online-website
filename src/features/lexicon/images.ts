import { env } from "@/config/env.config";
import { createImgproxyUrl, type ImgproxyUrl } from "@/lib/imgproxy";

let imageUrl: ImgproxyUrl | null | undefined;

/**
 * Signed imgproxy URLs for article images, which were stored outside the Lexikon API on the
 * previous site. Returns `undefined` when imgproxy is not configured, e.g. in tests.
 *
 * Read at request time, because private environment variables are only set at runtime.
 */
export function getImageUrl(): ImgproxyUrl | undefined {
	if (imageUrl === undefined) {
		const { IMGPROXY_BASE_URL, IMGPROXY_KEY, IMGPROXY_SALT, S3_BUCKET_NAME } = env;
		imageUrl =
			IMGPROXY_BASE_URL != null &&
			IMGPROXY_KEY != null &&
			IMGPROXY_SALT != null &&
			S3_BUCKET_NAME != null
				? createImgproxyUrl({
						baseUrl: IMGPROXY_BASE_URL,
						key: IMGPROXY_KEY,
						salt: IMGPROXY_SALT,
						bucketName: S3_BUCKET_NAME,
					})
				: null;
	}
	return imageUrl ?? undefined;
}
