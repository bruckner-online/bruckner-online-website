import type { Page } from "@playwright/test";

import { expect, test } from "~/e2e/lib/test";

/**
 * Marks the current document so a full page load, which discards it, can be told apart from
 * an Astro client router navigation, which keeps it.
 */
async function markDocument(page: Page) {
	await page.evaluate(() => {
		Object.assign(window, { __documentMarker: true });
	});
}

async function expectSameDocument(page: Page) {
	expect(
		await page.evaluate(() => {
			return "__documentMarker" in window;
		}),
	).toBe(true);
}

for (const { name, pathname } of [
	{ name: "Autor*innen", pathname: "/lexikon/autorinnen" },
	{ name: "Literatur", pathname: "/lexikon/literatur" },
]) {
	test(`lexicon nav link to ${pathname} uses the client router`, async ({ page }) => {
		await page.goto("/lexikon/projekt");
		await markDocument(page);
		await page
			.getByRole("navigation", { name: "Lexikon" })
			.getByRole("link", { name, exact: true })
			.click();
		await expect(page).toHaveURL(pathname);
		await expect(page.getByRole("main").locator("ol").first()).toBeVisible();
		await expectSameDocument(page);
	});
}

test("lexicon landing page tiles use the client router", async ({ page }) => {
	await page.goto("/lexikon");
	await markDocument(page);
	await page
		.getByRole("main")
		.getByRole("link", { name: /Bruckners Werke/ })
		.click();
	await expect(page).toHaveURL("/lexikon/werke");
	await expect(page.getByRole("main").getByRole("link", { name: /^Test article/ })).toBeVisible();
	await expectSameDocument(page);
});

test("lexicon alphabet links use the client router", async ({ page }) => {
	await page.goto("/lexikon/autorinnen");
	await markDocument(page);
	await page.getByRole("main").getByRole("link", { name: "C", exact: true }).click();
	await expect(page).toHaveURL("/lexikon/autorinnen?letter=c&start=1");
	await expect(
		page.getByRole("main").getByRole("link", { name: "C", exact: true }),
	).toHaveAttribute("aria-current", "page");
	await expectSameDocument(page);
});

test("lexicon search form uses the client router", async ({ page }) => {
	await page.goto("/lexikon");
	await markDocument(page);
	const form = page.getByRole("main").getByRole("search");
	await form.getByRole("searchbox").fill("Linz");
	await form.getByRole("button", { name: "Suche" }).click();
	await expect(page).toHaveURL("/lexikon/suche?q=Linz&field=all&start=1");
	await expect(
		page.getByRole("main").getByRole("link", { name: /^Test search result/ }),
	).toBeVisible();
	await expectSameDocument(page);
});
