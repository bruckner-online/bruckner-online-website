import { expect, test } from "~/e2e/lib/test";

test("IIIF manifest failure is visible and retry makes another request", async ({ page }) => {
	let requests = 0;
	await page.route("https://iiifpresentation.acdh.oeaw.ac.at/**", async (route) => {
		requests++;
		await route.fulfill({ status: 503, body: "Unavailable" });
	});
	await page.goto("/handschriften/?siglum=test");
	const status = page.locator("#viewer-unavailable");
	await expect(status).toBeVisible();
	await expect(page.locator("mirador-viewer")).toBeHidden();
	await status.getByRole("button", { name: "Erneut versuchen" }).click();
	await expect(status).toBeVisible();
	expect(requests).toBe(2);
});
