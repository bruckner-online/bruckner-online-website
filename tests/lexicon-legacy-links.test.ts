import assert from "node:assert/strict";
import { test } from "node:test";

import { rewriteLegacyLinks } from "../src/features/lexicon/legacy-links.ts";

void test("category links resolve to lexicon indexes, including those without a page id", () => {
	for (const [href, text, expected] of [
		["http://www.bruckner-online.at/?page_id=1317", "Sache", "/lexikon/sachbegriffe/"],
		["http://www.bruckner-online.at/?page_id=1319", "Werk", "/lexikon/werke/"],
		["http://www.bruckner-online.at/?page_id=", "Person", "/lexikon/personen/"],
		["http://www.bruckner-online.at/?page_id=", "Ort", "/lexikon/orte/"],
	] as const) {
		assert.equal(
			rewriteLegacyLinks(`<a target="_self" href="${href}">${text}</a>`),
			`<a target="_self" href="${expected}">${text}</a>`,
		);
	}
});

void test("page ids of the previous site resolve to current pages", () => {
	for (const [href, expected] of [
		["http://www.bruckner-online.at/?page_id=1928", "/forschung/chronologie-datenbank"],
		["http://www.bruckner-online.at/?page_id=1913", "/anton-bruckner-2024"],
		["http://www.bruckner-online.at/?page_id=1433&amp;id=d1e5394", "/lexikon/artikel/d1e5394"],
	] as const) {
		assert.equal(
			rewriteLegacyLinks(`<a href="${href}" class="externalLink">Text</a>`),
			`<a href="${expected}" class="externalLink">Text</a>`,
		);
	}
});

void test("legacy URL schemes resolve directly to current pages", () => {
	for (const [href, expected] of [
		["http://www.bruckner-online.at/wab-102", "/werkverzeichnis/wab?WAB=wab-102"],
		["http://www.bruckner-online.at/miradorDrucke.php?WAB=WAB084_1", "/erstdrucke?wabId=WAB084_1"],
		["http://www.bruckner-online.at/miradorAGA.php?AGA=AGA02", "/aga?aga=AGA02"],
		["https://bruckner-online.at/ABLO_e946c3049", "/lexikon/artikel/e946c3049"],
	] as const) {
		assert.equal(
			rewriteLegacyLinks(`<a href="${href}">Text</a>`),
			`<a href="${expected}">Text</a>`,
		);
	}
});

void test("other links to the previous site become relative", () => {
	assert.equal(
		rewriteLegacyLinks(`<a href="http://www.bruckner-online.at" class="externalLink">www</a>`),
		`<a href="/" class="externalLink">www</a>`,
	);
	assert.equal(
		rewriteLegacyLinks(`<a href="http://www.bruckner-online.at/?page_id=9999">Text</a>`),
		`<a href="/?page_id=9999">Text</a>`,
	);
});

void test("images on the previous site become relative", () => {
	const image = "/bilder_ablo/notenbeispiele/Gedenkst%C3%A4tten%20Alter%20Dom%20Tafel.png";
	assert.equal(
		rewriteLegacyLinks(
			`<a href="http://www.bruckner-online.at${image}"><img src="http://www.bruckner-online.at${image}" alt=""></a>`,
		),
		`<a href="${image}"><img src="${image}" alt=""></a>`,
	);
});

void test("images on the previous site are served by imgproxy when configured", () => {
	const image = "/bilder_ablo/notenbeispiele/Gedenkst%C3%A4tten%20Alter%20Dom%20Tafel.png";
	const imageUrl = (key: string, { width, height = 0 }: { width: number; height?: number }) => {
		return `https://images.example.org/${String(width)}x${String(height)}/${key}`;
	};
	const url = (size: string) => {
		return `https://images.example.org/${size}/notenbeispiele/Gedenkstätten Alter Dom Tafel.png`;
	};
	const figure = `<a href="http://www.bruckner-online.at${image}" target="_blank"><img src="http://www.bruckner-online.at${image}"></a>`;
	const srcset = [320, 640, 960, 1280, 1920]
		.map((width) => {
			return `${url(`${String(width)}x0`)} ${String(width)}w`;
		})
		.join(", ");
	const expected = (sizes: string) => {
		return [
			`<a href="${url("2560x2560")}" target="_blank">`,
			`<img src="${url("960x0")}" srcset="${srcset}" sizes="${sizes}" loading="lazy" decoding="async">`,
			`</a>`,
		].join("");
	};
	const text =
		"(min-width: 74rem) 845px, (min-width: 48rem) calc((100vw - 128px) * 0.8), calc(100vw - 96px)";
	const media =
		"(min-width: 74rem) 211px, (min-width: 48rem) calc((100vw - 128px) * 0.2), calc(100vw - 96px)";

	assert.equal(rewriteLegacyLinks(figure, { imageUrl }), expected(text));
	assert.equal(
		rewriteLegacyLinks(`<div>${figure}</div><div id="medienleiste">${figure}</div>`, { imageUrl }),
		`<div>${expected(text)}</div><div id="medienleiste">${expected(media)}</div>`,
	);
});

void test("only images below the previous image folder are served by imgproxy", () => {
	const imageUrl = () => {
		return "https://images.example.org/";
	};
	assert.equal(
		rewriteLegacyLinks(`<img src="http://www.bruckner-online.at/wp-content/a.png" alt="">`, {
			imageUrl,
		}),
		`<img src="/wp-content/a.png" alt="">`,
	);
	assert.equal(
		rewriteLegacyLinks(`<a href="http://www.bruckner-online.at/?page_id=1913">Text</a>`, {
			imageUrl,
		}),
		`<a href="/anton-bruckner-2024">Text</a>`,
	);
});

void test("short citations are replaced by the full citation", () => {
	assert.equal(
		rewriteLegacyLinks(
			`<li><a class="shortCit" href="#">Göll.-A.<span class="fullCit">August Göllerich, Anton Bruckner</span></a> 2/1, S. 64</li>`,
		),
		`<li>August Göllerich, Anton Bruckner 2/1, S. 64</li>`,
	);
});

void test("links to other sites and relative links are left unchanged", () => {
	const html = [
		`<a href="d1e5337">Article</a>`,
		`<a href="https://www.bruckner-online.at.example.org/wab-102">Elsewhere</a>`,
		`<a href="https://www.oeaw.ac.at/">ÖAW</a>`,
		`<img src="https://www.bruckner-online.at.example.org/a.png">`,
	].join("");
	assert.equal(rewriteLegacyLinks(html), html);
});
