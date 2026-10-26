import type { Locator, Page } from "@playwright/test";

import { expect, test } from "~/e2e/lib/test";

async function plottedPlaces(island: Locator) {
	return island.locator(".leaflet-marker-icon").evaluateAll((icons) => {
		return icons.reduce((count, icon) => {
			return count + (icon.classList.contains("marker-cluster") ? Number(icon.textContent) : 1);
		}, 0);
	});
}

/** Use the production island and renderer with deterministic table data and two independent mounts. */
async function withTableFixtures(page: Page) {
	await page.route("https://*.tile.openstreetmap.org/**", (route) => {
		return route.abort();
	});
	await page.route("**/forschung/kopisten/gesamtbestand/", async (route) => {
		const response = await route.fetch();
		const html = await response.text();
		const original = /<astro-island [^>]*component-export="MapTable"[\s\S]*?<\/astro-island>/.exec(
			html,
		)?.[0];
		expect(original).toBeDefined();
		const opening = original!.slice(0, original!.indexOf(">") + 1);
		function island(id: string, rows: string) {
			return `${opening.replace("<astro-island", `<astro-island data-testid="${id}"`)}<template data-astro-template="default"><div><table><thead><tr><th>Name</th><th>Ort</th></tr></thead><tbody>${rows}</tbody></table></div></template><!--astro:end--></astro-island>`;
		}
		const rows = Array.from({ length: 25 }, (_, index) => {
			return `<tr><td>Match ${String(index)}</td><td data-contenttype="place" data-lat="48" data-lng="14">Linz</td></tr>`;
		}).join("");
		const invalid =
			'<tr><td>Invalid</td><td data-contenttype="place"></td></tr><tr><td>Invalid empty</td><td data-contenttype="place" data-lat="" data-lng=""></td></tr><tr><td>Invalid range</td><td data-contenttype="place" data-lat="91" data-lng="181"></td></tr>';
		const first = island("first-table", rows + invalid);
		const second = island(
			"second-table",
			'<tr><td>Other</td><td data-contenttype="place" data-lat="40" data-lng="-74">New York</td></tr>',
		);
		await route.fulfill({ response, body: html.replace(original!, first + second) });
	});
}

test("map uses every matching row across pages and isolates multiple instances", async ({
	page,
}) => {
	const errors: Array<string> = [];
	page.on("pageerror", (error) => {
		errors.push(error.message);
	});
	await withTableFixtures(page);
	await page.goto("/forschung/kopisten/gesamtbestand/");
	const first = page.getByTestId("first-table");
	const second = page.getByTestId("second-table");
	await expect(first.locator("table tbody tr")).toHaveCount(20);
	await expect
		.poll(() => {
			return plottedPlaces(first);
		})
		.toBe(25);
	await expect
		.poll(() => {
			return plottedPlaces(second);
		})
		.toBe(1);
	await expect(second.locator("img.leaflet-marker-icon")).toHaveJSProperty("naturalWidth", 25);
	const search = first.getByRole("searchbox", { name: "Suchen" });
	await search.fill("Match");
	await expect(first.locator(".datatable-info")).toContainText("25");
	await expect
		.poll(() => {
			return plottedPlaces(first);
		})
		.toBe(25);
	await first.locator('.datatable-pagination [data-page="2"]').filter({ hasText: /^2$/ }).click();
	await expect(first.locator("table tbody tr")).toHaveCount(5);
	await expect
		.poll(() => {
			return plottedPlaces(first);
		})
		.toBe(25);
	await first.locator(".datatable-sorter").first().click();
	await expect
		.poll(() => {
			return plottedPlaces(first);
		})
		.toBe(25);
	await search.fill("Invalid");
	await expect(first.locator("table tbody tr")).toHaveCount(3);
	await expect
		.poll(() => {
			return plottedPlaces(first);
		})
		.toBe(0);
	await search.fill("no-such-copyist");
	await expect
		.poll(() => {
			return plottedPlaces(first);
		})
		.toBe(0);
	await expect
		.poll(() => {
			return plottedPlaces(second);
		})
		.toBe(1);
	await search.fill("");
	await expect
		.poll(() => {
			return plottedPlaces(first);
		})
		.toBe(25);
	expect(errors).toEqual([]);
});

test("unmounting disposes the map and table, and a fresh mount remains usable", async ({
	page,
}) => {
	await withTableFixtures(page);
	await page.goto("/forschung/kopisten/gesamtbestand/");
	const first = page.getByTestId("first-table");
	await expect(first.locator(".leaflet-map-pane")).toHaveCount(1);
	const disposed = await first.evaluate((island) => {
		const map = island.querySelector(".leaflet-container")!;
		const fresh = document.createElement("astro-island");
		for (const { name, value } of island.attributes) {
			fresh.setAttribute(name, value);
		}
		fresh.setAttribute("ssr", "");
		fresh.innerHTML =
			'<template data-astro-template="default"><div><table><thead><tr><th>Name</th><th>Ort</th></tr></thead><tbody><tr><td>Remounted</td><td data-contenttype="place" data-lat="48" data-lng="14">Linz</td></tr></tbody></table></div></template><!--astro:end-->';
		island.replaceWith(fresh);
		document.dispatchEvent(new Event("astro:after-swap"));
		return {
			mapPanes: map.querySelectorAll(".leaflet-map-pane").length,
			tables: island.querySelectorAll(".datatable-wrapper").length,
		};
	});
	expect(disposed).toEqual({ mapPanes: 0, tables: 0 });
	await expect(first.getByRole("searchbox", { name: "Suchen" })).toBeVisible();
	await expect
		.poll(() => {
			return plottedPlaces(first);
		})
		.toBe(1);
});

for (const path of ["gesamtbestand", "ausserhalb_wiens"]) {
	test(`${path} initializes the generated table and map without runtime errors`, async ({
		page,
	}) => {
		const errors: Array<string> = [];
		page.on("pageerror", (error) => {
			errors.push(error.message);
		});
		await page.route("https://*.tile.openstreetmap.org/**", (route) => {
			return route.abort();
		});
		await page.goto(`/forschung/kopisten/${path}/`);
		await expect(page.locator(".leaflet-map-pane")).toHaveCount(1);
		await expect(page.getByRole("searchbox", { name: "Suchen" })).toBeVisible();
		await expect
			.poll(() => {
				return plottedPlaces(page.locator('astro-island[component-export="MapTable"]'));
			})
			.toBeGreaterThan(0);
		expect(errors).toEqual([]);
	});
}

test("table-only pages retain working search without a map", async ({ page }) => {
	await page.goto("/forschung/kopisten/primaerquellen/");
	const search = page.getByRole("searchbox", { name: "Suchen" });
	await expect(search).toBeVisible();
	await search.fill("no-such-copyist");
	await expect(page.locator("table tbody")).not.toContainText("Aigner");
	await expect(page.locator(".leaflet-map-pane")).toHaveCount(0);
});
