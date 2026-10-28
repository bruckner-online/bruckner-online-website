import assert from "node:assert/strict";
import { test } from "node:test";

import mapping from "../src/features/digitised-sources/data/siglum_wab_mapping.json";
import { selectSource } from "../src/features/digitised-sources/source-viewing/index.ts";

void test("manuscripts default to the ordered catalog and select its first manifest", () => {
	const view = selectSource({ source: "hss" });
	assert.equal(view.catalog.length, mapping.length);
	assert.equal(view.windows[0]?.loadedManifest, view.catalog[0]?.manifestId);
	assert.equal(view.windows[0]!.viewType, "ThumbnailsView");
	assert.equal(view.windows[0]!.sidePanel, false);
	assert.deepEqual(selectSource({ source: "hss", siglum: "", wabId: "" }), view);
});

void test("WAB filtering uses complete tokens and preserves mapping order", () => {
	const wabId = "016";
	const expected = mapping.filter((entry) => {
		return entry.WAB.split(" ").includes(wabId);
	});
	const view = selectSource({ source: "hss", wabId });
	assert.deepEqual(
		view.catalog.map((entry) => {
			return entry.manifestId;
		}),
		expected.map((entry) => {
			return `https://iiifpresentation.acdh.oeaw.ac.at/bruckner/${entry.Signatur}/manifest`;
		}),
	);
	assert.deepEqual(selectSource({ source: "hss", wabId: "16" }).windows, []);
});

void test("explicit siglum overrides WAB selection", () => {
	const view = selectSource({ source: "hss", siglum: "A-WnMus.Hs.38849", wabId: "missing" });
	assert.equal(view.catalog.length, 1);
	assert.equal(
		view.windows[0]?.loadedManifest,
		"https://iiifpresentation.acdh.oeaw.ac.at/bruckner/A-WnMus.Hs.38849/manifest",
	);
});

void test("first editions and AGA share manifest construction with their own display defaults", () => {
	// Identifier formats as published by the IIIF server.
	for (const selection of [
		{ source: "ed", wabId: "WAB016" },
		{ source: "ed", wabId: "WAB083_1" },
		{ source: "aga", aga: "AGA15" },
	] as const) {
		const view = selectSource(selection);
		assert.deepEqual(view.catalog, []);
		assert.equal(view.windows[0]!.viewType, "ImageView");
		assert.equal(view.windows[0]!.sidePanel, selection.source === "aga");
		assert.equal(
			view.windows[0]?.loadedManifest,
			`https://iiifpresentation.acdh.oeaw.ac.at/bruckner/drucke/${selection.source === "ed" ? selection.wabId : selection.aga}/manifest`,
		);
	}
	assert.equal(
		selectSource({ source: "ed", wabId: "WAB084,1" }).windows[0]?.loadedManifest,
		"https://iiifpresentation.acdh.oeaw.ac.at/bruckner/drucke/WAB084%2C1/manifest",
	);
});

void test("empty, unmapped, and invalid selections never construct a manifest", () => {
	for (const selection of [
		{ source: "ed" },
		{ source: "aga" },
		{ source: "hss", wabId: "missing" },
	] as const) {
		assert.deepEqual(selectSource(selection), { catalog: [], windows: [] });
	}
	for (const identifier of [
		"../secret",
		".",
		"..",
		"a/b",
		"https://example.org",
		"a?b",
		"a#b",
		"%2f",
		" ",
	]) {
		for (const selection of [
			{ source: "hss", siglum: identifier },
			{ source: "ed", wabId: identifier },
			{ source: "aga", aga: identifier },
		] as const) {
			assert.deepEqual(selectSource(selection), { catalog: [], windows: [] });
		}
	}
});
