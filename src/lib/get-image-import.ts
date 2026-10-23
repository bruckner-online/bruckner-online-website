import { join } from "node:path";

import { assert } from "@acdh-oeaw/lib";
import type { ImageMetadata } from "astro";

const images = import.meta.glob<{ default: ImageMetadata }>(
	"/public/assets/**/*.{gif,jpeg,jpg,png,svg}",
);

export function getImageImport(path: string) {
	if (!path.startsWith("/")) {
		// oxlint-disable-next-line typescript/no-unsafe-return, typescript/no-explicit-any -- Astro Image props reject the string/image union.
		return path as any;
	}

	const publicPath = join("/public", path);
	const image = images[publicPath];
	assert(image, `Missing image "${publicPath}".`);

	return image();
}
