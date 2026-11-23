/** imgproxy rejects larger sources (`IMGPROXY_MAX_SRC_RESOLUTION`, 50 megapixels by default). */
export const defaultMaxMegapixels = 50;

/**
 * Returns the largest dimensions with the same aspect ratio that stay within the pixel limit, or
 * `null` when the image already fits.
 */
export function capResolution(
	width: number,
	height: number,
	maxMegapixels = defaultMaxMegapixels,
): { width: number; height: number } | null {
	const max = maxMegapixels * 1_000_000;
	if (width * height <= max) {
		return null;
	}
	const scale = Math.sqrt(max / (width * height));
	let capped = { width: Math.floor(width * scale), height: Math.floor(height * scale) };
	// Rounding to whole pixels can still overshoot by a few pixels.
	while (capped.width * capped.height > max) {
		capped =
			capped.width >= capped.height
				? { width: capped.width - 1, height: Math.floor((capped.width - 1) * (height / width)) }
				: { width: Math.floor((capped.height - 1) * (width / height)), height: capped.height - 1 };
	}
	return capped;
}
