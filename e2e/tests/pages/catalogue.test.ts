import { expect, test } from "~/e2e/lib/test";

test("WAB direct link remains available when the iframe cannot load", async ({ page }) => {
	await page.route("https://dwab.acdh-dev.oeaw.ac.at/**", (route) => {
		return route.abort();
	});
	await page.goto("/werkverzeichnis/wab/?WAB=wab-001");
	const link = page.getByRole("link", { name: "WAB-Katalog direkt öffnen" });
	await expect(link).toBeVisible();
	await expect(link).toHaveAttribute("href", "https://dwab.acdh-dev.oeaw.ac.at/wab-001.html");
	const iframe = page.locator('iframe[title="Werkverzeichnis Anton Bruckner"]');
	await expect(iframe).toHaveAttribute("src", "https://dwab.acdh-dev.oeaw.ac.at/wab-001.html");
	// The embed must reserve space; an undefined height utility once collapsed it to 0px.
	expect((await iframe.boundingBox())?.height).toBeGreaterThan(300);
});
