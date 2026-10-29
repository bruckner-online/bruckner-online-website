/** WordPress pages of the previous site, resolved via archived snapshots. */
const pages: Record<string, string> = {
	"1317": "/lexikon/sachbegriffe/",
	"1319": "/lexikon/werke/",
	"1913": "/anton-bruckner-2024",
	"1928": "/forschung/chronologie-datenbank",
};

/** URL schemes of the previous site, still linked from external sites, bookmarks and Lexikon articles. */
export function resolveLegacyUrl(url: URL): string | null {
	if (/wab-\d+$/.test(url.pathname)) {
		return `/werkverzeichnis/wab?WAB=${url.pathname.replace("/", "")}`;
	}

	if (url.pathname.includes("ABLO_")) {
		return `/lexikon/artikel/${url.pathname.replace("/ABLO_", "")}`;
	}

	if (url.pathname === "/miradorAGA.php") {
		const aga = url.searchParams.get("AGA");
		return aga ? `/aga?aga=${encodeURIComponent(aga)}` : "/aga";
	}

	if (url.pathname === "/miradorDrucke.php") {
		const wabId = url.searchParams.get("WAB");
		return wabId ? `/erstdrucke?wabId=${encodeURIComponent(wabId)}` : "/erstdrucke";
	}

	return null;
}

/** WordPress pages of the previous site were addressed by `page_id` on the homepage. */
export function resolveLegacyPageId(params: URLSearchParams): string | null {
	const pageId = params.get("page_id");
	// The article page took the article id as a separate parameter.
	const id = params.get("id");
	if (pageId === "1433" && id) {
		return `/lexikon/artikel/${encodeURIComponent(id)}`;
	}
	return pageId ? (pages[pageId] ?? null) : null;
}
