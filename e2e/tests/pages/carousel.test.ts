import { expect, test } from "~/e2e/lib/test";

test.beforeEach(async ({ page }) => {
	await page.emulateMedia({ reducedMotion: "no-preference" });
});

test("carousel exposes named groups, one-based slides, and keyboard controls", async ({
	page,
	createAccessibilityScanner,
}) => {
	await page.goto("/");
	const root = page.locator("[data-carousel]");
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

test("without JavaScript every slide remains available and inert controls are hidden", async ({
	browser,
}) => {
	const context = await browser.newContext({ javaScriptEnabled: false });
	try {
		const page = await context.newPage();
		await page.goto(`${String(test.info().project.use.baseURL)}/`);
		const root = page.locator("[data-carousel]");
		await expect(root.locator("[data-controls]")).toBeHidden();
		for (const slide of await root.locator("[data-carousel-item]").all()) {
			await expect(slide).toBeVisible();
			await expect(slide.locator("a").first()).toBeVisible();
		}
	} finally {
		await context.close();
	}
});
