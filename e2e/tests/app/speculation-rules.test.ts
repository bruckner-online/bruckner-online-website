import type { Page } from "@playwright/test";

import { expect, test } from "~/e2e/lib/test";

/** Records the pathnames of speculative loads, as reported by the browser. */
async function recordSpeculations(page: Page) {
	const speculations = { prerender: new Set<string>(), prefetch: new Set<string>() };
	const cdp = await page.context().newCDPSession(page);
	// Browsers disable prerendering while devtools are attached, but still report the attempt.
	cdp.on("Preload.prerenderStatusUpdated", (event) => {
		speculations.prerender.add(new URL(event.key.url).pathname);
	});
	cdp.on("Preload.prefetchStatusUpdated", (event) => {
		speculations.prefetch.add(new URL(event.key.url).pathname);
	});
	await cdp.send("Preload.enable");
	return speculations;
}

test("hovering a link to a page built ahead of time prerenders it", async ({ page }) => {
	await page.goto("/lexikon");
	const speculations = await recordSpeculations(page);
	await page
		.getByRole("navigation", { name: "Lexikon" })
		.getByRole("link", { name: "Projekt" })
		.hover();
	await expect
		.poll(() => {
			return [...speculations.prerender];
		})
		.toContain("/lexikon/projekt");
});

test("hovering a link to a page rendered on request only prefetches it", async ({ page }) => {
	await page.goto("/lexikon");
	const speculations = await recordSpeculations(page);
	await page
		.getByRole("main")
		.getByRole("link", { name: /Bruckners Werke/ })
		.hover();
	await expect
		.poll(() => {
			return [...speculations.prefetch];
		})
		.toContain("/lexikon/werke");
	expect(speculations.prerender.size).toBe(0);
});
