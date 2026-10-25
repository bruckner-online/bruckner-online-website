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
	await expect(page.locator('iframe[title="Werkverzeichnis Anton Bruckner"]')).toHaveAttribute(
		"src",
		"https://apps-mufo.oeaw.ac.at/dcm/wab/document.xq?doc=001.xml",
	);
});
