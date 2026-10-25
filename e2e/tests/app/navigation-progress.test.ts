import { expect, test } from "~/e2e/lib/test";

test("slow internal navigation shows progress and clears it when the server HTML arrives", async ({
	page,
}) => {
	await page.goto("/");
	let release!: () => void;
	const pending = new Promise<void>((resolve) => {
		release = resolve;
	});
	await page.route("**/lexikon/artikel/**", async (route) => {
		await pending;
		await route.continue();
	});
	await page.evaluate(() => {
		const link = document.createElement("a");
		link.href = "/lexikon/artikel/?letter=B&start=12";
		link.textContent = "Open test index";
		document.body.append(link);
	});
	const bar = page.getByRole("progressbar", { includeHidden: true });
	await expect(bar).toBeHidden();
	try {
		await page.getByRole("link", { name: "Open test index" }).click();
		await expect(bar).toBeVisible();
	} finally {
		release();
	}
	await expect(page.getByRole("main").getByRole("link", { name: /^Test article/ })).toBeVisible();
	await expect(bar).toBeHidden();
});

test("progress is delayed, clears on loader failure, and respects reduced motion", async ({
	page,
}) => {
	await page.emulateMedia({ reducedMotion: "reduce" });
	await page.goto("/");
	await page.clock.install();
	const navigation = await page.evaluateHandle(() => {
		const controller = new AbortController();
		const event = Object.assign(new Event("astro:before-preparation", { cancelable: true }), {
			signal: controller.signal,
			loader: () => {
				return Promise.reject(new Error("Navigation failed"));
			},
		});
		document.dispatchEvent(event);
		return event;
	});
	const bar = page.getByRole("progressbar", { includeHidden: true });
	await page.clock.runFor(199);
	await expect(bar).toBeHidden();
	await page.clock.runFor(1);
	await expect(bar).toBeVisible();
	expect(
		await bar.evaluate((element) => {
			return getComputedStyle(element, "::before").animationName;
		}),
	).toBe("none");
	await navigation.evaluate(async (event) => {
		try {
			await event.loader();
		} catch {
			/* The navigation failure is expected. */
		}
	});
	await expect(bar).toBeHidden();
});

test("fast and prevented navigations never leave a pending indicator", async ({ page }) => {
	await page.goto("/");
	await page.clock.install();
	await page.evaluate(async () => {
		const event = Object.assign(new Event("astro:before-preparation", { cancelable: true }), {
			signal: new AbortController().signal,
			loader: () => {
				return Promise.resolve();
			},
		});
		document.dispatchEvent(event);
		await event.loader();
	});
	await page.clock.runFor(300);
	await expect(page.getByRole("progressbar", { includeHidden: true })).toBeHidden();
	await page.evaluate(() => {
		const event = Object.assign(new Event("astro:before-preparation", { cancelable: true }), {
			signal: new AbortController().signal,
			loader: () => {
				return Promise.resolve();
			},
		});
		document.addEventListener(
			"astro:before-preparation",
			(event) => {
				event.preventDefault();
			},
			{ once: true },
		);
		document.dispatchEvent(event);
	});
	await page.clock.runFor(300);
	await expect(page.getByRole("progressbar", { includeHidden: true })).toBeHidden();
});

test("a cancelled navigation cannot clear a newer navigation's progress", async ({ page }) => {
	await page.goto("/");
	await page.clock.install();
	const navigations = await page.evaluateHandle(() => {
		function prepare() {
			const controller = new AbortController();
			const event = Object.assign(new Event("astro:before-preparation", { cancelable: true }), {
				signal: controller.signal,
				loader: () => {
					return Promise.resolve();
				},
			});
			document.dispatchEvent(event);
			return { controller, event };
		}
		const first = prepare();
		const second = prepare();
		return { first, second };
	});
	await page.clock.runFor(200);
	const bar = page.getByRole("progressbar", { includeHidden: true });
	await expect(bar).toBeVisible();
	await navigations.evaluate(async ({ first }) => {
		first.controller.abort();
		await first.event.loader();
	});
	await expect(bar).toBeVisible();
	await navigations.evaluate(({ second }) => {
		second.controller.abort();
	});
	await expect(bar).toBeHidden();
});
