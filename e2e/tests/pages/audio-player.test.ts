import type { Route } from "@playwright/test";

import { expect, test } from "~/e2e/lib/test";

// One minute of silence. Exercise real media events without downloading or playing recordings.
const audio = Buffer.alloc(44 + 8000 * 60, 128);
audio.write("RIFF", 0);
audio.writeUInt32LE(audio.length - 8, 4);
audio.write("WAVEfmt ", 8);
audio.writeUInt32LE(16, 16);
audio.writeUInt16LE(1, 20);
audio.writeUInt16LE(1, 22);
audio.writeUInt32LE(8000, 24);
audio.writeUInt32LE(8000, 28);
audio.writeUInt16LE(1, 32);
audio.writeUInt16LE(8, 34);
audio.write("data", 36);
audio.writeUInt32LE(audio.length - 44, 40);

function serveAudio(route: Route) {
	const range = /^bytes=(\d+)-(\d*)$/.exec(route.request().headers().range ?? "");
	const start = range ? Number(range[1]) : 0;
	const end = range?.[2] ? Math.min(Number(range[2]), audio.length - 1) : audio.length - 1;
	return route.fulfill({
		status: range ? 206 : 200,
		headers: {
			"Accept-Ranges": "bytes",
			...(range
				? { "Content-Range": `bytes ${String(start)}-${String(end)}/${String(audio.length)}` }
				: {}),
		},
		body: audio.subarray(start, end + 1),
		contentType: "audio/wav",
	});
}

test.beforeEach(async ({ page }) => {
	await page.route("**/*.mp3", (route) => {
		return serveAudio(route);
	});
});

test("playlist tracks support Enter and Space with an announced current selection", async ({
	page,
	createAccessibilityScanner,
}) => {
	await page.goto("/audio/symphonien/");
	const player = page.locator("audio-player").first();
	const media = player.locator("audio");
	await expect(media).toHaveAttribute("controls", "");
	await expect(media).toHaveAttribute("preload", "none");
	const track = player.getByRole("button", { name: "Adagio", exact: true });
	await track.focus();
	await track.press("Enter");
	await expect(track).toBeFocused();
	await expect(track).toHaveAttribute("aria-current", "true");
	await expect(player.getByRole("status")).toContainText("Adagio");
	await expect
		.poll(() => {
			return media.evaluate((node) => {
				return (node as HTMLAudioElement).paused;
			});
		})
		.toBe(false);
	const first = player.getByRole("button", { name: "Allegro", exact: true });
	await first.focus();
	await first.press("Space");
	await expect(first).toHaveAttribute("aria-current", "true");
	await expect(player.locator('[aria-current="true"]')).toHaveCount(1);
	const { getViolations } = await createAccessibilityScanner();
	expect(await getViolations({ selector: "audio-player" })).toEqual([]);
});

test("pausing and resuming the current recording preserves playback position", async ({ page }) => {
	await page.goto("/audio/symphonien/");
	const player = page.locator("audio-player").first();
	const media = player.locator("audio");
	const track = player.getByRole("button", { name: "Adagio", exact: true });
	await track.click();
	await expect
		.poll(() => {
			return media.evaluate((node) => {
				return (node as HTMLAudioElement).readyState;
			});
		})
		.toBeGreaterThanOrEqual(2);
	await media.evaluate(async (node) => {
		const media = node as HTMLAudioElement;
		const seeked = new Promise<void>((resolve) => {
			media.addEventListener(
				"seeked",
				() => {
					resolve();
				},
				{ once: true },
			);
		});
		media.currentTime = 20;
		await seeked;
		media.pause();
	});
	await expect(player.getByRole("status")).toContainText("Pausiert:");
	await media.evaluate((node) => {
		return (node as HTMLAudioElement).play();
	});
	await expect
		.poll(() => {
			return media.evaluate((node) => {
				return (node as HTMLAudioElement).currentTime;
			});
		})
		.toBeGreaterThanOrEqual(20);
	await track.click();
	await expect
		.poll(() => {
			return media.evaluate((node) => {
				return (node as HTMLAudioElement).currentTime;
			});
		})
		.toBeGreaterThanOrEqual(20);
});

test("the next track starts at the end without moving keyboard focus", async ({ page }) => {
	await page.goto("/audio/symphonien/");
	const player = page.locator("audio-player").first();
	const first = player.getByRole("button", { name: "Allegro", exact: true });
	await first.focus();
	await first.press("Enter");
	await player.locator("audio").evaluate((node) => {
		(node as HTMLAudioElement).pause();
		node.dispatchEvent(new Event("ended"));
	});
	await expect(player.getByRole("button", { name: "Adagio", exact: true })).toHaveAttribute(
		"aria-current",
		"true",
	);
	await expect(first).toBeFocused();
});

test("playback errors are announced and the same track can be retried", async ({ page }) => {
	let unavailable = true;
	const errors: Array<string> = [];
	page.on("pageerror", (error) => {
		errors.push(error.message);
	});
	await page.route("**/*.mp3", (route) => {
		return unavailable ? route.fulfill({ status: 503, body: "Unavailable" }) : serveAudio(route);
	});
	await page.goto("/audio/symphonien/");
	const player = page.locator("audio-player").first();
	const track = player.getByRole("button", { name: "Adagio", exact: true });
	await track.click();
	await expect(player.getByRole("status")).toContainText("nicht abgespielt");
	unavailable = false;
	await track.click();
	await expect
		.poll(() => {
			return player.locator("audio").evaluate((node) => {
				return (node as HTMLAudioElement).paused;
			});
		})
		.toBe(false);
	await expect(player.getByRole("status")).toContainText("Sie hören:");
	expect(errors).toEqual([]);
});

test("removing a player stops its recording", async ({ page }) => {
	await page.goto("/audio/symphonien/");
	const player = page.locator("audio-player").first();
	await player.getByRole("button", { name: "Adagio", exact: true }).click();
	const media = await player.locator("audio").elementHandle();
	await expect
		.poll(() => {
			return media!.evaluate((node) => {
				return (node as HTMLAudioElement).paused;
			});
		})
		.toBe(false);
	await player.evaluate((node) => {
		node.remove();
	});
	await expect
		.poll(() => {
			return media!.evaluate((node) => {
				return (node as HTMLAudioElement).paused;
			});
		})
		.toBe(true);
});

test("without JavaScript native audio and links to every recording remain available", async ({
	browser,
}) => {
	const context = await browser.newContext({ javaScriptEnabled: false });
	try {
		const page = await context.newPage();
		await page.goto(`${String(test.info().project.use.baseURL)}/audio/symphonien/`);
		const player = page.locator("audio-player").first();
		await expect(player.locator("audio")).toHaveAttribute("controls", "");
		await expect(player.getByRole("link", { name: "Adagio", exact: true })).toHaveAttribute(
			"href",
			/\.mp3$/,
		);
		await expect(player.locator("[data-playlist]")).toBeHidden();
	} finally {
		await context.close();
	}
});
