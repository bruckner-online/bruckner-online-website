import type { Page } from "@playwright/test";

import { expect, test } from "~/e2e/lib/test";

/** Holds matching requests until released. */
async function holdRequests(page: Page, matches: (url: URL) => boolean) {
	// Speculative loads bypass request interception, so remove the rules which trigger them.
	await page.locator('script[type="speculationrules"]').evaluateAll((scripts) => {
		for (const script of scripts) {
			script.remove();
		}
	});
	let release!: () => void;
	const pending = new Promise<void>((resolve) => {
		release = resolve;
	});
	await page.route(matches, async (route) => {
		await pending;
		await route.continue();
	});
	return release;
}

/**
 * Resolves with the text of the element marked as pending. Playwright does not run new scripts in
 * a page while it navigates, so this must start before the navigation.
 */
function waitForPendingElement(page: Page) {
	return page.evaluate(() => {
		return new Promise<string | null>((resolve) => {
			new MutationObserver((_mutations, observer) => {
				const element = document.querySelector("[data-navigation-pending]");
				if (element != null) {
					observer.disconnect();
					resolve(element.textContent.trim());
				}
			}).observe(document.body, { attributeFilter: ["data-navigation-pending"], subtree: true });
		});
	});
}

test("a slow navigation marks the clicked link as pending", async ({ page }) => {
	await page.goto("/lexikon/autorinnen");
	const release = await holdRequests(page, (url) => {
		return url.searchParams.get("letter") === "c";
	});
	const pendingElement = waitForPendingElement(page);
	const link = page.getByRole("main").getByRole("link", { name: "C", exact: true });
	const click = link.click();
	try {
		expect(await pendingElement).toBe("C");
	} finally {
		release();
	}
	await click;
	await expect(link).toHaveAttribute("aria-current", "page");
	await expect(page.locator("[data-navigation-pending]")).toHaveCount(0);
});

test("a slow form submission marks the submit button as pending", async ({ page }) => {
	await page.goto("/lexikon");
	const release = await holdRequests(page, (url) => {
		return url.pathname === "/lexikon/suche";
	});
	const pendingElement = waitForPendingElement(page);
	const form = page.getByRole("main").getByRole("search");
	await form.getByRole("searchbox").fill("Linz");
	const click = form.getByRole("button", { name: "Suche" }).click();
	try {
		expect(await pendingElement).toBe("Suche");
	} finally {
		release();
	}
	await click;
	await expect(page).toHaveURL(/\/lexikon\/suche/);
	await expect(page.locator("[data-navigation-pending]")).toHaveCount(0);
});
