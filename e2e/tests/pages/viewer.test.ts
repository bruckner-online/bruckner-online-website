import type { Page } from "@playwright/test";

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

const iiif = "https://iiifpresentation.acdh.oeaw.ac.at";
// 1×1 transparent PNG, enough for Mirador to render canvases and thumbnails.
const png = Buffer.from(
	"iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
	"base64",
);

/** Serve a minimal two-canvas IIIF manifest for every manifest URL, labelled with its identifier. */
async function mockIiif(page: Page, options: { failing?: Array<string> } = {}) {
	const requested: Array<string> = [];
	await page.route(`${iiif}/**`, async (route) => {
		const url = route.request().url();
		if (!url.endsWith("/manifest")) {
			await route.fulfill({ contentType: "image/png", body: png });
			return;
		}
		requested.push(url);
		if (options.failing?.includes(url)) {
			await route.fulfill({ status: 503, body: "Unavailable" });
			return;
		}
		const label = decodeURIComponent(url.split("/").at(-2)!);
		await route.fulfill({
			json: {
				"@context": "http://iiif.io/api/presentation/3/context.json",
				id: url,
				type: "Manifest",
				label: { none: [label] },
				items: [1, 2].map((n) => {
					const canvas = `${url}/canvas/${String(n)}`;
					return {
						id: canvas,
						type: "Canvas",
						label: { none: [`${label} ${String(n)}`] },
						width: 100,
						height: 100,
						items: [
							{
								id: `${canvas}/page`,
								type: "AnnotationPage",
								items: [
									{
										id: `${canvas}/image`,
										type: "Annotation",
										motivation: "painting",
										target: canvas,
										body: {
											id: `${iiif}/images/${String(n)}.png`,
											type: "Image",
											format: "image/png",
											width: 100,
											height: 100,
										},
									},
								],
							},
						],
					};
				}),
			},
		});
	});
	return requested;
}

function viewer(page: Page) {
	return {
		window: page.getByRole("region", { name: /^Window: / }),
		gallery: page.getByRole("region", { name: "gallery section" }),
		sideBar: page.getByLabel("Sidebar panels navigation"),
		resourceList: page.locator(".mirador-workspace-add"),
	};
}

test("a manuscript opens in the gallery view with the side bar closed", async ({ page }) => {
	await mockIiif(page);
	await page.goto("/handschriften/?siglum=A-WnMus.Hs.38849");
	const { window, gallery, sideBar, resourceList } = viewer(page);
	await expect(window).toHaveCount(1);
	await expect(window).toHaveAccessibleName("Window: A-WnMus.Hs.38849");
	await expect(gallery).toBeVisible();
	await expect(sideBar).toBeHidden();
	// A single manuscript opens directly, without the resource list in front of it.
	await expect(resourceList).toHaveCount(0);
});

test("a first edition opens in the single image view with the side bar closed", async ({
	page,
}) => {
	await mockIiif(page);
	await page.goto("/erstdrucke/?wabId=WAB001");
	const { window, gallery, sideBar, resourceList } = viewer(page);
	await expect(window).toHaveAccessibleName("Window: WAB001");
	await expect(gallery).toHaveCount(0);
	await expect(sideBar).toBeHidden();
	await expect(resourceList).toHaveCount(0);
});

test("an AGA volume opens in the single image view with the side bar open", async ({ page }) => {
	await mockIiif(page);
	await page.goto("/aga/?aga=AGA15");
	const { window, gallery, sideBar } = viewer(page);
	await expect(window).toHaveAccessibleName("Window: AGA15");
	await expect(gallery).toHaveCount(0);
	await expect(sideBar).toBeVisible();
});

test("several manuscripts open the resource list, and a picked one opens in the gallery view", async ({
	page,
}) => {
	const manifest = (siglum: string) => {
		return `${iiif}/bruckner/${siglum}/manifest`;
	};
	// The first catalog entry being unavailable must not hide the list of the others.
	const requested = await mockIiif(page, { failing: [manifest("A-WnMus.Hs.19732")] });
	await page.goto("/handschriften/?wab=016");
	const { window, gallery, sideBar, resourceList } = viewer(page);
	await expect(resourceList).toBeVisible();
	await expect(page.locator("#viewer-unavailable")).toBeHidden();
	await expect(window).toHaveCount(0);
	const entry = resourceList.locator(`[data-manifestid="${manifest("A-WnMus.Hs.19734")}"]`);
	await entry.getByRole("button", { name: "A-WnMus.Hs.19734" }).click();
	await expect(window).toHaveCount(1);
	await expect(window).toHaveAccessibleName("Window: A-WnMus.Hs.19734");
	// Windows added from the list get the manuscript defaults too.
	await expect(gallery).toBeVisible();
	await expect(sideBar).toBeHidden();
	expect(requested).toContain(manifest("A-WnMus.Hs.19734"));
});
