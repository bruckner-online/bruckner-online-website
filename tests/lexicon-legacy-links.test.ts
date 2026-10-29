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

void test("links to other sites and relative links are left unchanged", () => {
	const html = [
		`<a href="d1e5337">Article</a>`,
		`<a href="https://www.bruckner-online.at.example.org/wab-102">Elsewhere</a>`,
		`<a href="https://www.oeaw.ac.at/">ÖAW</a>`,
		`<img src="https://www.bruckner-online.at.example.org/a.png">`,
	].join("");
	assert.equal(rewriteLegacyLinks(html), html);
});
