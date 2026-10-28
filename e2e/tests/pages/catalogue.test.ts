import { expect, test } from "~/e2e/lib/test";

test("WAB direct link remains available when the iframe cannot load", async ({ page }) => {
	await page.route("https://apps-mufo.oeaw.ac.at/**", (route) => {
		return route.abort();
	});
	await page.goto("/werkverzeichnis/wab/?WAB=001");
	const link = page.getByRole("link", { name: "WAB-Katalog direkt öffnen" });
	await expect(link).toBeVisible();
	await expect(link).toHaveAttribute(
		"href",
		"https://apps-mufo.oeaw.ac.at/dcm/wab/document.xq?doc=001.xml",
	);
	const iframe = page.locator('iframe[title="Werkverzeichnis Anton Bruckner"]');
	await expect(iframe).toHaveAttribute(
		"src",
		"https://apps-mufo.oeaw.ac.at/dcm/wab/document.xq?doc=001.xml",
	);
	// The embed must reserve space; an undefined height utility once collapsed it to 0px.
	expect((await iframe.boundingBox())?.height).toBeGreaterThan(300);
});
