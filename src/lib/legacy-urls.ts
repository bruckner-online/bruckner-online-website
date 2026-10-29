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
