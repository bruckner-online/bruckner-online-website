import type { ImgproxyUrl } from "../../lib/imgproxy.ts";
import { resolveLegacyPageId, resolveLegacyUrl } from "../../lib/legacy-urls.ts";
import { type Category, pathnames } from "./client.ts";

const origin = /^https?:\/\/(?:www\.)?bruckner-online\.at(?=[/?#]|$)/i;
const link = /(<a\b[^>]*?\shref=")([^"]*)("[^>]*>)([^<]*)/gi;
const image = /<img\b([^>]*?)\ssrc="https?:\/\/(?:www\.)?bruckner-online\.at(\/[^"]*)"([^>]*)>/gi;
const source = /(\ssrc=")https?:\/\/(?:www\.)?bruckner-online\.at(?=\/)/gi;

/** Images of the previous site lived below this path; object keys are the paths below it. */
const imagesPath = "/bilder_ablo/";
/** Widths offered in `srcset`. */
const imageWidths = [320, 640, 960, 1280, 1920];
const imageFallbackWidth = 960;
/**
 * Rendered image widths, see `.row:has(#medienleiste)` in `index.css`. Below `md`, images span
 * the card (viewport minus 96px section and card padding). From `md`, the article text and the
 * media column share the card in a 4:1 grid with a 32px gap, up to the 1088px card content at
 * `max-w-screen-lg` (74rem).
 */
const imageSizes = {
	text: "(min-width: 74rem) 845px, (min-width: 48rem) calc((100vw - 128px) * 0.8), calc(100vw - 96px)",
	media:
		"(min-width: 74rem) 211px, (min-width: 48rem) calc((100vw - 128px) * 0.2), calc(100vw - 96px)",
};
/** Images after this marker are in the media column, e.g. figures under "Abbildungen". */
const mediaColumn = 'id="medienleiste"';
/** Linked full-size views are bounded in both dimensions, since sources reach 100 megapixels. */
const imageLinkSize = 2560;

export interface RewriteOptions {
	/** Serves images of the previous site; without it, they keep their (unavailable) paths. */
	imageUrl?: ImgproxyUrl;
}

function imageKey(pathname: string): string | null {
	if (!pathname.startsWith(imagesPath)) {
		return null;
	}
	try {
		return decodeURIComponent(pathname.slice(imagesPath.length)).normalize("NFC");
	} catch {
		return null;
	}
}

function resolve(url: URL, text: string): string {
	const location = resolveLegacyUrl(url);
	if (location != null) {
		return location;
	}

	if (url.pathname === "/" && url.searchParams.has("page_id")) {
		// Category links of person and place articles have an empty `page_id`.
		if (Object.hasOwn(pathnames, text)) {
			return pathnames[text as Category];
		}
		const pathname = resolveLegacyPageId(url.searchParams);
		if (pathname != null) {
			return pathname;
		}
	}

	return url.pathname + url.search + url.hash;
}

/** Article markup from the Lexikon API still links to the previous site. */
export function rewriteLegacyLinks(html: string, options: RewriteOptions = {}): string {
	const { imageUrl } = options;

	const linked = html.replace(
		link,
		(match, before: string, href: string, after: string, text: string) => {
			if (!origin.test(href)) {
				return match;
			}
			const url = new URL(href.replaceAll("&amp;", "&"));
			const key = imageKey(url.pathname);
			if (imageUrl != null && key != null) {
				const location = imageUrl(key, { width: imageLinkSize, height: imageLinkSize });
				return `${before}${location}${after}${text}`;
			}
			const location = resolve(url, text.trim()).replaceAll("&", "&amp;");
			return `${before}${location}${after}${text}`;
		},
	);
	const media = linked.indexOf(mediaColumn);

	return linked
		.replace(image, (match, before: string, pathname: string, after: string, offset: number) => {
			const key = imageKey(pathname);
			if (imageUrl == null || key == null) {
				return `<img${before} src="${pathname}"${after}>`;
			}
			const src = imageUrl(key, { width: imageFallbackWidth });
			const srcset = imageWidths
				.map((width) => {
					return `${imageUrl(key, { width })} ${String(width)}w`;
				})
				.join(", ");
			const sizes = media !== -1 && offset > media ? imageSizes.media : imageSizes.text;
			return `<img${before} src="${src}" srcset="${srcset}" sizes="${sizes}" loading="lazy" decoding="async"${after}>`;
		})
		.replace(source, "$1");
}
