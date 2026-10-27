import { expect, test } from "~/e2e/lib/test";

test.beforeEach(async ({ page }) => {
	await page.emulateMedia({ reducedMotion: "no-preference" });
});

test("slide changes animate movement together with the fade", async ({ page }) => {
	await page.goto("/");
	const next = page.locator("[data-control-next]");
	await next.focus();
	const transitions = await next.evaluate((button) => {
		const root = button.closest("[data-carousel]")!;
		const outgoing = root.querySelector("[data-active]")!;
		// Finish any initial rendering transitions before measuring navigation.
		root.getAnimations({ subtree: true }).forEach((animation) => {
			animation.finish();
		});
		getComputedStyle(outgoing).getPropertyValue("translate");
		(button as HTMLButtonElement).click();
		const incoming = root.querySelector("[data-active]")!;
		getComputedStyle(incoming).getPropertyValue("translate");
		return [outgoing, incoming].map((slide) => {
			return slide.getAnimations().map((animation) => {
				return (animation as CSSTransition).transitionProperty;
			});
		});
	});
	for (const properties of transitions) {
		expect(properties).toEqual(expect.arrayContaining(["opacity", "translate"]));
	}
});

test("carousel exposes named groups, one-based slides, and keyboard controls", async ({
	page,
	createAccessibilityScanner,
}) => {
	await page.goto("/");
	const root = page.locator("[data-carousel]");
	await expect(page.locator("[data-carousel-fallback]")).toHaveCount(0);
	await expect(root).toHaveRole("group");
	await expect(root).toHaveAccessibleName(/.+/);
	await expect(root.locator("[data-carousel-item]").first()).toHaveAccessibleName(/^1 von /);
	const next = root.locator("[data-control-next]");
	await next.focus();
	await next.press("Enter");
	await expect(next).toBeFocused();
	await expect(root.locator("[data-active]")).toHaveAccessibleName(/^2 von /);
	await expect(root.locator("[data-carousel-items]")).toHaveAttribute("aria-live", "polite");
	await expect(root.locator("[data-carousel-item][inert]")).toHaveCount(
		(await root.locator("[data-carousel-item]").count()) - 1,
	);
	const { getViolations } = await createAccessibilityScanner();
	expect(await getViolations({ selector: "image-carousel" })).toEqual([]);
});

test("focus stops rotation until explicitly restarted, without leaking hover timers", async ({
	page,
}) => {
	await page.clock.install();
	await page.goto("/");
	const root = page.locator("[data-carousel]");
	await expect(root).toHaveAttribute("data-state", "playing");
	const toggle = root.locator("[data-control-toggle]");
	await toggle.focus();
	await expect(root).toHaveAttribute("data-state", "paused");
	await root.locator("[data-carousel-items]").hover();
	await page.mouse.move(0, 0);
	await expect(root).toHaveAttribute("data-state", "paused");
	await page.locator('header a[href="/"]').first().focus();
	await expect(root).toHaveAttribute("data-state", "paused");
	await toggle.focus();
	await page.clock.runFor(15_100);
	await expect(root.locator("[data-active]")).toHaveAccessibleName(/^1 von /);
	await toggle.press("Enter");
	await expect(root).toHaveAttribute("data-state", "playing");
	await expect(root.locator("[data-carousel-items]")).toHaveAttribute("aria-live", "off");
	await page.clock.runFor(5100);
	await expect(root.locator("[data-active]")).toHaveAccessibleName(/^2 von /);
	await toggle.press("Space");
	await page.clock.runFor(15_100);
	await expect(root).toHaveAttribute("data-state", "paused");
	await expect(root.locator("[data-active]")).toHaveAccessibleName(/^2 von /);
});

test.describe("touch controls", () => {
	test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

	test("rotation can be stopped on mobile without a focus-induced restart", async ({ page }) => {
		await page.clock.install();
		await page.goto("/");
		const root = page.locator("[data-carousel]");
		await expect(root).toHaveAttribute("data-state", "playing");
		const toggle = root.locator("[data-control-toggle]");
		await expect(toggle).toBeVisible();
		await expect(root.locator("[data-control-next]")).toBeVisible();
		await toggle.tap();
		await expect(root).toHaveAttribute("data-state", "paused");
		await page.clock.runFor(10_100);
		await expect(root.locator("[data-active]")).toHaveAccessibleName(/^1 von /);
	});
});

test("reduced motion prevents autoplay but allows an explicit start", async ({ page }) => {
	await page.emulateMedia({ reducedMotion: "reduce" });
	await page.goto("/");
	const root = page.locator("[data-carousel]");
	await expect(root).toHaveAttribute("data-state", "paused");
	const toggle = root.locator("[data-control-toggle]");
	await toggle.focus();
	await toggle.press("Enter");
	await expect(root).toHaveAttribute("data-state", "playing");
});

test("enabling reduced motion stops active rotation without restarting on preference reversal", async ({
	page,
}) => {
	await page.goto("/");
	const root = page.locator("[data-carousel]");
	await expect(root).toHaveAttribute("data-state", "playing");
	await page.emulateMedia({ reducedMotion: "reduce" });
	await expect(root).toHaveAttribute("data-state", "paused");
	await page.emulateMedia({ reducedMotion: "no-preference" });
	await expect(root).toHaveAttribute("data-state", "paused");
});

for (const width of [390, 1280]) {
	test(`without JavaScript the ${String(width)}px layout shows one feature and all remaining links`, async ({
		browser,
		createI18n,
	}) => {
		const { t } = await createI18n();
		const context = await browser.newContext({
			javaScriptEnabled: false,
			viewport: { width, height: 900 },
		});
		try {
			const page = await context.newPage();
			await page.goto(`${String(test.info().project.use.baseURL)}/`);
			const root = page.locator("[data-carousel]");
			const expected = await root.locator("[data-carousel-item]").evaluateAll((slides) => {
				return slides.map((slide) => {
					const link = slide.querySelector("a")!;
					return { title: link.getAttribute("aria-label"), href: link.getAttribute("href") };
				});
			});
			await expect(root).toBeHidden();
			const fallback = page.getByRole("region", { name: t("IndexPage.carousel.title") });
			await expect(fallback).toBeVisible();
			await expect(fallback.locator("img")).toHaveCount(1);
			await expect(fallback.getByRole("button")).toHaveCount(0);
			await expect(
				fallback.getByRole("heading", { name: expected[0]!.title!, exact: true }),
			).toBeVisible();
			await expect(
				fallback.getByRole("heading", { name: t("ImageCarousel.more-topics") }),
			).toBeVisible();
			await expect(fallback.getByRole("listitem")).toHaveCount(expected.length - 1);
			const links = fallback.getByRole("link");
			await expect(links).toHaveCount(expected.length);
			for (const [index, slide] of expected.entries()) {
				await expect(links.nth(index)).toHaveAttribute("href", slide.href!);
				await expect(links.nth(index)).toHaveAccessibleName(slide.title!);
			}
			await links.first().focus();
			await page.keyboard.press("Tab");
			await expect(links.nth(1)).toBeFocused();
			await links.nth(1).press("Enter");
			await expect(page).toHaveURL(new RegExp(`${expected[1]!.href!}/?$`));
		} finally {
			await context.close();
		}
	});
}
