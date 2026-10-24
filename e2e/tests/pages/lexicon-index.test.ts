import type { Route } from "@playwright/test";

import { baseUrl } from "@/lib/lexicon";
import { expect, test } from "~/e2e/lib/test";

const article = { id: "test-article", title: "Test article" };
const literature = {
	id: "test-literature",
	full: { bibl: { "#text": "Test literature citation" } },
};
function author(sortName: string, fullName: string) {
	return {
		id: sortName,
		person: {
			persName: [
				{ type: "sortName", "#text": sortName },
				{ type: "full", "#text": fullName },
				{ type: "abbreviation", "#text": sortName },
			],
		},
	};
}

for (const { routeName, category } of [
	{ routeName: "artikel", category: null },
	{ routeName: "personen", category: "Person" },
	{ routeName: "orte", category: "Ort" },
	{ routeName: "sachbegriffe", category: "Sache" },
	{ routeName: "werke", category: "Werk" },
]) {
	test(`${routeName} preserves article query parameters and links`, async ({ page }) => {
		await page.route(`${baseUrl}/**`, async (route) => {
			await route.fulfill({ json: { results: { article, total: "1" } } });
		});
		const request = page.waitForRequest(`${baseUrl}/**`);
		await page.goto(`/lexikon/${routeName}/?letter=B&start=12`);
		const url = new URL((await request).url());
		expect(url.pathname).toBe("/article");
		expect(Object.fromEntries(url.searchParams)).toEqual({
			title: "b",
			startAt: "12",
			max: "500",
			...(category === null ? {} : { category }),
		});
		const main = page.getByRole("main");
		await expect(main.getByRole("link", { name: "Test article", exact: true })).toHaveAttribute(
			"href",
			"/lexikon/artikel/test-article",
		);
		await expect(main.getByRole("link", { name: "B", exact: true })).toHaveAttribute(
			"aria-current",
			"page",
		);
	});
}

for (const { query, letter, start } of [
	{ query: "", letter: "a", start: "0" },
	{ query: "?letter=%21&start=invalid", letter: "a", start: "1" },
	{ query: "?letter=C&start=-2.5", letter: "c", start: "-2.5" },
]) {
	test(`article index preserves query parsing for ${query || "missing parameters"}`, async ({
		page,
	}) => {
		await page.route(`${baseUrl}/**`, async (route) => {
			await route.fulfill({ json: { results: { article: [article], total: "1" } } });
		});
		const request = page.waitForRequest(`${baseUrl}/**`);
		await page.goto(`/lexikon/artikel/${query}`);
		const url = new URL((await request).url());
		expect(url.searchParams.get("title")).toBe(letter);
		expect(url.searchParams.get("startAt")).toBe(start);
		await expect(
			page.getByRole("main").getByRole("link", { name: "Test article", exact: true }),
		).toBeVisible();
	});
}

test("authors use the authors endpoint and sort links by sort name", async ({ page }) => {
	await page.route(`${baseUrl}/**`, async (route) => {
		await route.fulfill({
			json: {
				results: {
					item: [author("Zeller", "Anna Zeller"), author("Adler", "Zoe Adler")],
					total: "2",
				},
			},
		});
	});
	const request = page.waitForRequest(`${baseUrl}/**`);
	await page.goto("/lexikon/autorinnen/?letter=Z&start=4");
	const url = new URL((await request).url());
	expect(url.pathname).toBe("/authors");
	expect(Object.fromEntries(url.searchParams)).toEqual({ title: "z", startAt: "4", max: "500" });
	const links = page.getByRole("main").locator("ol").getByRole("link");
	await expect(links).toHaveText(["Zoe Adler", "Anna Zeller"]);
	await expect(links.first()).toHaveAttribute("href", "/lexikon/autorinnen/Zoe Adler");
	await expect(links.last()).toHaveAttribute("href", "/lexikon/autorinnen/Anna Zeller");
});

test("literature uses the literature endpoint and renders a singleton citation", async ({
	page,
}) => {
	await page.route(`${baseUrl}/**`, async (route) => {
		await route.fulfill({ json: { results: { item: literature, total: "1" } } });
	});
	const request = page.waitForRequest(`${baseUrl}/**`);
	await page.goto("/lexikon/literatur/?letter=L&start=7");
	const url = new URL((await request).url());
	expect(url.pathname).toBe("/literature");
	expect(Object.fromEntries(url.searchParams)).toEqual({ title: "l", startAt: "7", max: "500" });
	await expect(page.getByRole("main").locator("ol").getByRole("listitem")).toHaveText([
		"Test literature citation",
	]);
});

for (const routeName of ["artikel", "autorinnen", "literatur"]) {
	test(`${routeName} shows loading and then an API error`, async ({ page, createI18n }) => {
		const { t } = await createI18n();
		let resolveRoute: (route: Route) => void;
		const intercepted = new Promise<Route>((resolve) => {
			resolveRoute = resolve;
		});
		await page.route(`${baseUrl}/**`, (route) => {
			resolveRoute(route);
		});
		await page.goto(`/lexikon/${routeName}/`);
		const route = await intercepted;
		const main = page.getByRole("main");
		try {
			await expect(main.getByRole("status")).toHaveText(t("SearchResults.pending"));
		} finally {
			await route.fulfill({
				status: 400,
				json: { error: "Invalid request" },
			});
		}
		await expect(main.getByText(t("SearchResults.error"), { exact: true })).toBeVisible();
		await expect(main.getByRole("status")).toHaveCount(0);
	});
}
