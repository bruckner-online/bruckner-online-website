import { expect, test } from "~/e2e/lib/test";

for (const path of ["einleitung", "d1e21087"]) {
	test(`${path} changes edition language without hiding unrelated content`, async ({ page }) => {
		await page.goto(`/forschung/kopisten/${path}/`);
		const toggle = page.locator('astro-island[component-export="KopistenLanguageToggle"]');
		const german = toggle.getByRole("button", { name: "DE", exact: true });
		const english = toggle.getByRole("button", { name: "EN", exact: true });
		await expect(german).toHaveAttribute("aria-pressed", "true");
		const contentId = await english.getAttribute("aria-controls");
		const content = page.locator(`[id="${String(contentId)}"]`);
		await expect(content.locator('[lang="de"]').first()).toBeVisible();
		await expect(content.locator('[lang="en"]').first()).toBeHidden();
		await page.evaluate(() => {
			const unrelated = document.createElement("aside");
			unrelated.innerHTML =
				'<p lang="en" data-testid="outside-english">Outside English</p><p lang="fr" data-testid="outside-french">Outside French</p>';
			document.body.append(unrelated);
		});
		await english.click();
		await expect(english).toHaveAttribute("aria-pressed", "true");
		await expect(german).toHaveAttribute("aria-pressed", "false");
		await expect(content.locator('[lang="en"]').first()).toBeVisible();
		await expect(content.locator('[lang="de"]').first()).toBeHidden();
		await expect(page.getByTestId("outside-english")).toBeVisible();
		await expect(page.getByTestId("outside-french")).toBeVisible();

		// Later content, such as a hydrated table, must inherit the current choice.
		await content.evaluate((root) => {
			root.insertAdjacentHTML(
				"beforeend",
				'<div lang="en" class="hidden" data-testid="late-english">Late English</div><div lang="de" data-testid="late-german">Late German</div><p lang="fr" data-testid="inside-french">Inside French</p>',
			);
		});
		await expect(page.getByTestId("late-english")).toBeVisible();
		await expect(page.getByTestId("late-german")).toBeHidden();
		await expect(page.getByTestId("inside-french")).toBeVisible();
		await german.click();
		await expect(german).toHaveAttribute("aria-pressed", "true");
		await expect(page.getByTestId("late-german")).toBeVisible();
		await expect(page.getByTestId("late-english")).toBeHidden();
		await expect(page.getByTestId("outside-english")).toBeVisible();
		await expect(page.getByTestId("outside-french")).toBeVisible();
	});
}

test("two language controls change only their own content", async ({ page }) => {
	await page.goto("/forschung/kopisten/einleitung/");
	const first = page.locator('astro-island[component-export="KopistenLanguageToggle"]');
	await expect(first.getByRole("button", { name: "DE", exact: true })).toBeVisible();
	await first.evaluate((original) => {
		const scope = document.createElement("section");
		scope.innerHTML =
			'<div id="second-language-content" data-kopisten-language="de"><p lang="de" data-testid="second-german">German</p><p lang="en" class="hidden" data-testid="second-english">English</p></div>';
		const second = document.createElement("astro-island");
		for (const { name, value } of original.attributes) {
			second.setAttribute(name, value);
		}
		const props = JSON.parse(original.getAttribute("props")!) as Record<string, unknown>;
		props.contentId = [0, "second-language-content"];
		second.setAttribute("props", JSON.stringify(props));
		second.setAttribute("ssr", "");
		second.setAttribute("data-testid", "second-toggle");
		second.innerHTML = "<!--astro:end-->";
		scope.prepend(second);
		document.body.append(scope);
	});
	const second = page.getByTestId("second-toggle");
	await second.getByRole("button", { name: "EN", exact: true }).click();
	await expect(page.getByTestId("second-english")).toBeVisible();
	await expect(page.getByTestId("second-german")).toBeHidden();
	const original = page.locator('astro-island[component-export="KopistenLanguageToggle"]').first();
	await expect(original.getByRole("button", { name: "DE", exact: true })).toHaveAttribute(
		"aria-pressed",
		"true",
	);
	await original.getByRole("button", { name: "EN", exact: true }).click();
	await original.getByRole("button", { name: "DE", exact: true }).click();
	await expect(page.getByTestId("second-english")).toBeVisible();
	await expect(page.getByTestId("second-german")).toBeHidden();
});
