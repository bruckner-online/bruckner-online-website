import type { APIContext, MiddlewareNext } from "astro";

export function onRequest(context: APIContext, next: MiddlewareNext) {
	const { url, redirect } = context;

	/** URL schemes of the previous site, still linked from external sites and bookmarks. */
	if (/wab-\d+$/.test(url.pathname)) {
		return redirect(`/werkverzeichnis/wab?WAB=${url.pathname.replace("/", "")}`, 301);
	}

	if (url.pathname.includes("ABLO_")) {
		return redirect(`/lexikon/artikel/${url.pathname.replace("/ABLO_", "")}`, 301);
	}

	if (url.pathname === "/miradorAGA.php") {
		const aga = url.searchParams.get("AGA");
		return redirect(aga ? `/aga?aga=${encodeURIComponent(aga)}` : "/aga", 301);
	}

	if (url.pathname === "/miradorDrucke.php") {
		const wabId = url.searchParams.get("WAB");
		return redirect(wabId ? `/erstdrucke?wabId=${encodeURIComponent(wabId)}` : "/erstdrucke", 301);
	}

	return next();
}
