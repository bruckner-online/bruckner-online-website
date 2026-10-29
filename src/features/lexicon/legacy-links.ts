import { resolveLegacyPageId, resolveLegacyUrl } from "../../lib/legacy-urls.ts";
import { type Category, pathnames } from "./client.ts";

const origin = /^https?:\/\/(?:www\.)?bruckner-online\.at(?=[/?#]|$)/i;
const link = /(<a\b[^>]*?\shref=")([^"]*)("[^>]*>)([^<]*)/gi;
const source = /(\ssrc=")https?:\/\/(?:www\.)?bruckner-online\.at(?=\/)/gi;

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
export function rewriteLegacyLinks(html: string): string {
	return html
		.replace(link, (match, before: string, href: string, after: string, text: string) => {
			if (!origin.test(href)) {
				return match;
			}
			const url = new URL(href.replaceAll("&amp;", "&"));
			const location = resolve(url, text.trim()).replaceAll("&", "&amp;");
			return `${before}${location}${after}${text}`;
		})
		.replace(source, "$1");
}
