import { expect, test } from "~/e2e/lib/test";

// API responses are supplied by the standalone server's test-only fetch adapter.
// No browser JavaScript is needed to render any of these lists.
test.use({ javaScriptEnabled: false });

for (const { routeName, category } of [
	{ routeName: "artikel", category: null },
	{ routeName: "personen", category: "Person" },
	{ routeName: "orte", category: "Ort" },
	{ routeName: "sachbegriffe", category: "Sache" },
	{ routeName: "werke", category: "Werk" },
]) {
	test(`${routeName} renders HTML with the requested filters and links`, async ({ page }) => {
		const response = await page.goto(`/lexikon/${routeName}/?letter=B&start=12`);
		const label = `Test article ${JSON.stringify({ title: "b", startAt: "12", max: "500", ...(category === null ? {} : { category }) })}`;
		expect(await response!.text()).toContain("Test article");
		const main = page.getByRole("main");
		await expect(main.getByRole("link", { name: label, exact: true })).toHaveAttribute(
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
		await page.goto(`/lexikon/artikel/${query}`);
		const label = `Test article ${JSON.stringify({ title: letter, startAt: start, max: "500" })}`;
		await expect(
			page.getByRole("main").getByRole("link", { name: label, exact: true }),
		).toBeVisible();
	});
}

test("authors render sorted links without JavaScript", async ({ page }) => {
	await page.goto("/lexikon/autorinnen/?letter=B&start=4");
	const marker = JSON.stringify({ title: "b", startAt: "4", max: "500" });
	const links = page.getByRole("main").locator("ol").getByRole("link");
	await expect(links).toHaveText([`Zoe Adler ${marker}`, `Anna Zeller ${marker}`]);
	await expect(links.first()).toHaveAttribute("href", `/lexikon/autorinnen/Zoe Adler ${marker}`);
});

test("literature renders a singleton citation without JavaScript", async ({ page }) => {
	await page.goto("/lexikon/literatur/?letter=L&start=7");
	await expect(page.getByRole("main").locator("ol").getByRole("listitem")).toHaveText([
		`Test citation ${JSON.stringify({ title: "l", startAt: "7", max: "500" })}`,
	]);
});

for (const routeName of ["artikel", "autorinnen", "literatur"]) {
	test(`${routeName} renders an upstream error in HTML`, async ({ page, createI18n }) => {
		const { t } = await createI18n();
		await page.goto(`/lexikon/${routeName}/?letter=E`);
		await expect(
			page.getByRole("main").getByText(t("SearchResults.error"), { exact: true }),
		).toBeVisible();
		await expect(page.getByRole("link", { name: "Erneut versuchen" })).toHaveAttribute(
			"href",
			`/lexikon/${routeName}/?letter=E`,
		);
	});

	test(`${routeName} renders an empty state in HTML`, async ({ page, createI18n }) => {
		const { t } = await createI18n();
		await page.goto(`/lexikon/${routeName}/?letter=Z`);
		await expect(
			page.getByRole("main").getByText(t("SearchResults.nothing-found"), { exact: true }),
		).toBeVisible();
	});
}
