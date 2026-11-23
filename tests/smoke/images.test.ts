/**
 * Smoke tests for Lexikon images against running object storage and imgproxy.
 *
 * Start the local services first (`docker compose up -d --wait`), which upload the fixture in
 * `tests/fixtures/images`. Reads IMGPROXY_BASE_URL, IMGPROXY_KEY, IMGPROXY_SALT, and S3_BUCKET_NAME
 * from the environment or `.env.local`; for another instance, upload the fixture to its bucket.
 */
import assert from "node:assert/strict";
import { before, test } from "node:test";

import sharp from "sharp";

import { rewriteLegacyLinks } from "../../src/features/lexicon/legacy-links.ts";
import { createImgproxyUrl } from "../../src/lib/imgproxy.ts";
import { imgproxyConfig } from "../../src/scripts/images/config.ts";

const config = imgproxyConfig();
const imgproxyUrl = createImgproxyUrl(config);

/** `tests/fixtures/images/notenbeispiele/Gedenkstätten Testbild.png`, 2400×600. */
const fixture = { key: "notenbeispiele/Gedenkstätten Testbild.png", width: 2400, height: 600 };
/** Markup as returned by the Lexikon API. */
const article = `<div class="tei-figure-Abbildung" id="abb1"><a href="http://www.bruckner-online.at/bilder_ablo/notenbeispiele/Gedenkst%C3%A4tten%20Testbild.png" target="_blank"><img src="http://www.bruckner-online.at/bilder_ablo/notenbeispiele/Gedenkst%C3%A4tten%20Testbild.png"></a><p class="tei-figcaption">Abbildung 1</p></div>`;

/** `Accept` header of Chromium for images. */
const modern = "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8";

async function load(url: string, accept = modern) {
	const response = await fetch(url, { headers: { accept } });
	const body = Buffer.from(await response.arrayBuffer());
	return { response, body };
}

before(async () => {
	const response = await fetch(new URL("/health", config.baseUrl)).catch((error: unknown) => {
		throw new Error(
			`imgproxy is not reachable at ${config.baseUrl}. Run \`docker compose up -d --wait\`.`,
			{ cause: error },
		);
	});
	assert.equal(response.status, 200, "imgproxy health check failed");
});

void test("article images load at every srcset width, never enlarged", async () => {
	const html = rewriteLegacyLinks(article, { imageUrl: imgproxyUrl });
	const srcset = /\ssrcset="([^"]+)"/.exec(html)?.[1];
	assert.ok(srcset, "missing srcset");

	for (const candidate of srcset.split(", ")) {
		const [url, descriptor] = candidate.split(" ") as [string, string];
		const { response, body } = await load(url);
		assert.equal(response.status, 200, url);
		assert.equal(response.headers.get("content-type"), "image/webp");
		const metadata = await sharp(body).metadata();
		const width = Math.min(Number.parseInt(descriptor, 10), fixture.width);
		assert.equal(metadata.width, width, descriptor);
		assert.equal(metadata.height, Math.round((fixture.height * width) / fixture.width));
	}
});

void test("article image src and link load", async () => {
	const html = rewriteLegacyLinks(article, { imageUrl: imgproxyUrl });
	for (const pattern of [/\ssrc="([^"]+)"/, /\shref="([^"]+)"/]) {
		const url = pattern.exec(html)?.[1] ?? "";
		assert.ok(url.startsWith(config.baseUrl), `${String(pattern)} not rewritten: ${url}`);
		const { response } = await load(url);
		assert.equal(response.status, 200, url);
	}
});

void test("format follows the Accept header", async () => {
	const url = imgproxyUrl(fixture.key, { width: 480 });
	for (const [accept, type] of [
		[modern, "image/webp"],
		["image/png,*/*", "image/png"],
	] as const) {
		const { response } = await load(url, accept);
		assert.equal(response.headers.get("content-type"), type, accept);
		assert.match(response.headers.get("vary") ?? "", /\bAccept\b/i);
	}
});

void test("responses are cacheable", async () => {
	const { response } = await load(imgproxyUrl(fixture.key, { width: 480 }));
	assert.match(response.headers.get("cache-control") ?? "", /\bmax-age=[1-9]\d*/);
});

void test("unsigned or tampered URLs are rejected", async () => {
	const url = imgproxyUrl(fixture.key, { width: 480 });
	const tampered = url.replace("/rs:fit:480:0/", "/rs:fit:4800:0/");
	assert.equal((await load(tampered)).response.status, 403);
	const base = config.baseUrl.replace(/\/+$/, "");
	const path = url.slice(base.length).replace(/^\/[^/]+/, "");
	assert.equal((await load(`${base}/insecure${path}`)).response.status, 403);
});

void test("missing images return 404", async () => {
	const { response } = await load(imgproxyUrl("notenbeispiele/missing.png", { width: 480 }));
	assert.equal(response.status, 404);
});
