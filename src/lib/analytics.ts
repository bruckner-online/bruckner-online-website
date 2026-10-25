declare global {
	interface Window {
		_paq?: Array<unknown>;
	}
}

export function createAnalyticsScript(baseUrl: string, id: number): void {
	const _paq = (window._paq = window._paq ?? []);
	_paq.push(["disableCookies"]);
	_paq.push(["enableHeartBeatTimer"]);
	const u = baseUrl;
	_paq.push(["setTrackerUrl", `${u}matomo.php`]);
	_paq.push(["setSiteId", id]);
	/**
	 * Speculation rules can prerender pages which are never visited, so wait until a page is shown.
	 * Use `window._paq`, because `matomo.js` replaces the queue once it has loaded.
	 */
	function track() {
		window._paq?.push(["trackPageView"]);
		window._paq?.push(["enableLinkTracking"]);
	}
	if ("prerendering" in document && document.prerendering) {
		document.addEventListener("prerenderingchange", track, { once: true });
	} else {
		track();
	}
	const d = document,
		g = d.createElement("script"),
		s = d.getElementsByTagName("script")[0];
	g.async = true;
	g.src = `${u}matomo.js`;
	s?.parentNode?.insertBefore(g, s);
}
