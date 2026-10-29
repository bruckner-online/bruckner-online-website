import { expect, test } from "~/e2e/lib/test";

test("URLs of the previous site redirect permanently to their current pages", async ({
	request,
}) => {
	for (const [legacy, current] of [
		["/ABLO_e946c3049", "/lexikon/artikel/e946c3049"],
		["/wab-101", "/werkverzeichnis/wab?WAB=wab-101"],
		["/miradorAGA.php?AGA=AGA15", "/aga?aga=AGA15"],
		["/miradorDrucke.php?WAB=WAB001", "/erstdrucke?wabId=WAB001"],
		["/miradorDrucke.php?WAB=WAB084,1", "/erstdrucke?wabId=WAB084%2C1"],
		["/miradorAGA.php", "/aga"],
	]) {
		const response = await request.get(legacy!, { maxRedirects: 0 });
		expect(response.status(), legacy).toBe(301);
		const location = new URL(response.headers().location!, response.url());
		expect(location.pathname + location.search, legacy).toBe(current);
	}
});

test("links to WordPress pages of the previous site redirect to their current pages", async ({
	page,
}) => {
	for (const [legacy, current] of [
		["/?page_id=1913", "/anton-bruckner-2024"],
		["/?page_id=1433&id=d1e5394", "/lexikon/artikel/d1e5394"],
	]) {
		await page.goto(legacy!);
		await expect(page).toHaveURL((url) => {
			return url.pathname + url.search === current;
		});
	}

	await page.goto("/?page_id=9999");
	await expect(page).toHaveURL((url) => {
		return url.pathname === "/";
	});
});

test("content links to current pages instead of URLs of the previous site", async ({ page }) => {
	for (const path of [
		"/drucke/alte-gesamtausgabe",
		"/drucke/erstdrucke-digitalisate",
		"/drucke/erstdrucke",
	]) {
		await page.goto(path);
		await expect(page.locator('main a[href*=".php"]')).toHaveCount(0);
		await expect(page.locator('main a[href*="bruckner-online.at/ABLO_"]')).toHaveCount(0);
		await expect(page.locator('main a[href*="bruckner-online.at/wab-"]')).toHaveCount(0);
	}
	await expect(page.locator('main a[href^="/lexikon/artikel/"]').first()).toBeAttached();
});
