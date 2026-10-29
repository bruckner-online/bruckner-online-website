import { resolveLegacyUrl } from "../../lib/legacy-urls.ts";
import { type Category, pathnames } from "./client.ts";

/** WordPress pages of the previous site linked from articles, resolved via archived snapshots. */
const pages: Record<string, string> = {
	"1317": pathnames.Sache,
	"1319": pathnames.Werk,
	"1913": "/anton-bruckner-2024",
	"1928": "/forschung/chronologie-datenbank",
};

const origin = /^https?:\/\/(?:www\.)?bruckner-online\.at(?=[/?#]|$)/i;
const link = /(<a\b[^>]*?\shref=")([^"]*)("[^>]*>)([^<]*)/gi;
const source = /(\ssrc=")https?:\/\/(?:www\.)?bruckner-online\.at(?=\/)/gi;

function resolve(url: URL, text: string): string {
	const location = resolveLegacyUrl(url);
	if (location != null) {
		return location;
	}

	const pageId = url.searchParams.get("page_id");
	if (url.pathname === "/" && pageId != null) {
		// Category links of person and place articles have an empty `page_id`.
		if (Object.hasOwn(pathnames, text)) {
			return pathnames[text as Category];
		}
		// The article page took the article id as a separate parameter.
		const id = url.searchParams.get("id");
		if (pageId === "1433" && id) {
			return `${pathnames.Artikel}${encodeURIComponent(id)}`;
		}
		const pathname = pages[pageId];
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
