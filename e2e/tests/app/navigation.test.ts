import { expect, test } from "~/e2e/lib/test";

test("dropdown keyboard navigation returns focus and closes when leaving the menu", async ({
	page,
}) => {
	await page.goto("/lexikon");
	const header = page.locator("header");
	const trigger = header.getByRole("button", { name: "Projekt", exact: true });
	const menu = header
		.locator("[data-nav-menu]")
		.filter({ has: page.getByRole("button", { name: "Projekt", exact: true }) });
	const links = menu.locator("[data-popover] a");

	await trigger.focus();
	await trigger.press("ArrowDown");
	await expect(trigger).toHaveAttribute("aria-expanded", "true");
	await expect(links.first()).toBeFocused();
	await page.keyboard.press("ArrowDown");
	await expect(links.nth(1)).toBeFocused();
	await page.keyboard.press("End");
	await expect(links.last()).toBeFocused();
	await page.keyboard.press("ArrowDown");
	await expect(links.first()).toBeFocused();
	await page.keyboard.press("ArrowUp");
	await expect(links.last()).toBeFocused();
	await page.keyboard.press("Home");
	await expect(links.first()).toBeFocused();
	await page.keyboard.press("Escape");
	await expect(trigger).toBeFocused();
	await expect(trigger).toHaveAttribute("aria-expanded", "false");

	await trigger.press("ArrowDown");
	await links.last().focus();
	await page.keyboard.press("Tab");
	await expect(header.getByRole("button", { name: "Bruckner", exact: true })).toBeFocused();
	await expect(trigger).toHaveAttribute("aria-expanded", "false");
});

test("dropdowns open exclusively and close on outside interaction", async ({ page }) => {
	await page.goto("/lexikon");
	const header = page.locator("header");
	const project = header.getByRole("button", { name: "Projekt", exact: true });
	const bruckner = header.getByRole("button", { name: "Bruckner", exact: true });
	await project.click();
	await expect(project).toHaveAttribute("aria-expanded", "true");
	await bruckner.click();
	await expect(project).toHaveAttribute("aria-expanded", "false");
	await expect(bruckner).toHaveAttribute("aria-expanded", "true");
	await page.getByRole("heading", { level: 1 }).click();
	await expect(bruckner).toHaveAttribute("aria-expanded", "false");
});

test("desktop and mobile share all main and Lexikon links, including grouped external links", async ({
	page,
}) => {
	await page.goto("/lexikon");
	const desktop = page.locator("header nav > ul a");
	const mobile = page.locator("[data-mobile-nav] a");
	const readLinks = (links: typeof desktop) => {
		return links.evaluateAll((elements) => {
			return elements.map((element) => {
				return { label: element.textContent.trim(), href: element.getAttribute("href") };
			});
		});
	};
	const desktopLinks = await readLinks(desktop);
	expect(await readLinks(mobile)).toEqual(desktopLinks);
	expect(desktopLinks).toContainEqual({
		label: "Kindheit und Jugend (1824-1845)",
		href: "/leben/kindheit-und-jugend",
	});
	expect(desktopLinks).toContainEqual({
		label: "Anton Bruckner Urtext Gesamtausgabe",
		href: "https://hermann.eu/home/label/BEW",
	});
	const lexiconDesktop = page
		.getByRole("navigation", { name: "Lexikon", exact: true })
		.locator("ul a");
	expect(await readLinks(page.locator("[data-mobile-lexicon-nav] a"))).toEqual(
		await readLinks(lexiconDesktop),
	);

	const mobileNavToggle = page.getByRole("button", {
		name: "Navigationsmenü öffnen",
		exact: true,
	});
	const mobileLexiconNavToggle = page.getByRole("button", {
		name: "Navigationsmenü für Lexikon öffnen",
		exact: true,
	});

	await page.setViewportSize({ width: 390, height: 844 });
	await expect(mobileNavToggle).toHaveAttribute("aria-expanded", "false");
	await mobileNavToggle.click();
	await expect(mobileNavToggle).toHaveAttribute("aria-expanded", "true");
	await expect(page.locator("[data-mobile-nav]")).toBeVisible();
	await page.locator("[data-mobile-nav] summary").filter({ hasText: "Bruckner" }).click();
	await expect(mobile.filter({ hasText: "Kindheit und Jugend" })).toBeVisible();
	// Menus share a `name`, so opening another one closes the previous one.
	await page.locator("[data-mobile-nav] summary").filter({ hasText: "Projekt" }).click();
	await expect(mobile.filter({ hasText: "Kindheit und Jugend" })).toBeHidden();
	await page.locator("[data-mobile-nav] summary").filter({ hasText: "Bruckner" }).click();
	await mobileLexiconNavToggle.click();
	await expect(mobileLexiconNavToggle).toHaveAttribute("aria-expanded", "true");
	await expect(page.locator("[data-mobile-lexicon-nav]")).toBeVisible();
	await mobileNavToggle.click();
	await expect(mobileNavToggle).toHaveAttribute("aria-expanded", "false");
	await expect(page.locator("[data-mobile-nav]")).toBeHidden();
	await expect(page.locator("[data-mobile-lexicon-nav]")).toBeVisible();
});

test("desktop dropdown links remain available without JavaScript", async ({ browser }) => {
	const context = await browser.newContext({
		javaScriptEnabled: false,
		viewport: { width: 1280, height: 900 },
	});
	const page = await context.newPage();
	try {
		await page.goto(`${String(test.info().project.use.baseURL)}/lexikon`);
		const header = page.locator("header");
		await expect(header.getByRole("button", { name: "Projekt", exact: true })).toHaveAttribute(
			"aria-expanded",
			"true",
		);
		await expect(header.getByRole("link", { name: "Mitarbeiter", exact: true })).toBeVisible();
		await expect(
			header.getByRole("link", { name: "Kindheit und Jugend (1824-1845)", exact: true }),
		).toBeVisible();
	} finally {
		await context.close();
	}
});

test("main and Kopisten dropdowns retain independent targets and keyboard behavior", async ({
	page,
}) => {
	await page.goto("/forschung/kopisten/einleitung");
	const primary = page.getByRole("navigation", { name: "Primär", exact: true });
	const kopisten = page.getByRole("navigation", { name: "Kopisten", exact: true });
	const project = primary.getByRole("button", { name: "Projekt", exact: true });
	const description = kopisten.getByRole("button", { name: "Projektbeschreibung", exact: true });
	await project.click();
	await description.focus();
	await expect(project).toHaveAttribute("aria-expanded", "false");
	await description.press("ArrowDown");
	await expect(kopisten.getByRole("link", { name: "Über das Projekt", exact: true })).toBeFocused();
	await page.keyboard.press("Escape");
	await expect(description).toBeFocused();
	await expect(description).toHaveAttribute("aria-expanded", "false");
	const ids = await page.locator("[id]").evaluateAll((elements) => {
		return elements.map((element) => {
			return element.id;
		});
	});
	expect(new Set(ids).size).toBe(ids.length);
});

test("hovering an adjacent dropdown link does not cover the keyboard focus ring", async ({
	page,
}) => {
	await page.goto("/lexikon");
	const trigger = page.locator("header").getByRole("button", { name: "Forschung", exact: true });
	await trigger.focus();
	await trigger.press("ArrowDown");
	const focused = page
		.locator("header")
		.getByRole("link", { name: "Digitale Edition", exact: true });
	const neighbor = page.locator("header").getByRole("link", { name: "Projekt", exact: true });
	await expect(focused).toBeFocused();
	await expect(focused).toHaveCSS("outline-style", "solid");
	await expect(focused).toHaveCSS("outline-width", "2px");
	await page.evaluate(() => {
		return document.fonts.ready;
	});
	const bounds = await focused.boundingBox();
	expect(bounds).not.toBeNull();
	// Compare only the straight bottom edge, where the neighboring hover background overlapped it.
	const clip = {
		x: Math.ceil(bounds!.x) + 8,
		y: Math.ceil(bounds!.y + bounds!.height),
		width: Math.floor(bounds!.width) - 16,
		height: 2,
	};
	const before = await page.screenshot({ clip, animations: "disabled" });
	await neighbor.hover();
	await expect(focused).toBeFocused();
	const after = await page.screenshot({ clip, animations: "disabled" });
	await page
		.locator("header [data-popover]")
		.filter({ has: page.getByRole("link", { name: "Digitale Edition", exact: true }) })
		.screenshot({ path: test.info().outputPath("hovered-menu.png") });
	await test.info().attach("focused-edge", { body: before, contentType: "image/png" });
	await test
		.info()
		.attach("focused-edge-with-adjacent-hover", { body: after, contentType: "image/png" });
	expect(after.equals(before), "Adjacent hover must preserve the complete focus-ring edge").toBe(
		true,
	);
});
