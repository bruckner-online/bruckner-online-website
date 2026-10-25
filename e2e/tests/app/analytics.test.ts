import { createUrl } from "@acdh-oeaw/lib";

import { expect, test } from "~/e2e/lib/test";

if (process.env.PUBLIC_MATOMO_BASE_URL && process.env.PUBLIC_MATOMO_ID) {
	test.describe("analytics service", () => {
		const trackerUrl = String(
			createUrl({ baseUrl: process.env.PUBLIC_MATOMO_BASE_URL!, pathname: "/matomo.php*" }),
		);

		test("should track page views", async ({ createIndexPage }) => {
			const { i18n, indexPage } = await createIndexPage();

			const initialResponsePromise = indexPage.page.waitForResponse(trackerUrl);
			await indexPage.goto();
			const initialResponse = await initialResponsePromise;
			expect(initialResponse.status()).toBe(204);

			const responsePromise = indexPage.page.waitForResponse(trackerUrl);
			await indexPage.page
				.getByRole("link", { name: i18n.t("WebsiteFooter.links.imprint") })
				.click();
			const response = await responsePromise;
			expect(response.status()).toBe(204);
		});

		test("should not track prerendered pages until they are shown", async ({ page }) => {
			// Browsers disable prerendering while devtools are attached, so emulate it.
			await page.addInitScript(() => {
				Object.defineProperty(document, "prerendering", { configurable: true, value: true });
			});
			const requests: Array<string> = [];
			page.on("request", (request) => {
				if (request.url().includes("matomo.php")) {
					requests.push(request.url());
				}
			});

			await page.goto("/");
			await page.waitForFunction(() => {
				return "Matomo" in window;
			});
			expect(requests).toHaveLength(0);

			const responsePromise = page.waitForResponse(trackerUrl);
			await page.evaluate(() => {
				Object.defineProperty(document, "prerendering", { configurable: true, value: false });
				document.dispatchEvent(new Event("prerenderingchange"));
			});
			const response = await responsePromise;
			expect(response.status()).toBe(204);
		});
	});
}
