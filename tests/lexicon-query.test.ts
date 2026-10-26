import assert from "node:assert/strict";
import { test } from "node:test";

import {
	parseLexiconIndexQuery,
	parseLexiconPagination,
	parseLexiconSearchQuery,
} from "../src/features/lexicon/query.ts";

void test("pagination accepts safe positive decimal offsets and defaults malformed input to one", () => {
	for (const value of [
		null,
		"",
		"0",
		"-1",
		"-2.5",
		"1.5",
		"01",
		"+1",
		" 2 ",
		"2\n",
		"1e3",
		"0x10",
		"NaN",
		"Infinity",
		"invalid",
		"9007199254740992",
		"9".repeat(400),
	]) {
		const params = new URLSearchParams();
		if (value !== null) {
			params.set("start", value);
		}
		assert.deepEqual(parseLexiconPagination(params), { start: 1 }, `start=${String(value)}`);
	}
	for (const value of ["1", "12", "501", "9007199254740991"]) {
		assert.deepEqual(parseLexiconPagination(new URLSearchParams({ start: value })), {
			start: Number(value),
		});
	}
});

void test("index filters accept exactly one A–Z letter and share pagination defaults", () => {
	assert.deepEqual(parseLexiconIndexQuery(new URLSearchParams()), { letter: "a", start: 1 });
	assert.deepEqual(parseLexiconIndexQuery(new URLSearchParams("letter=B&start=12")), {
		letter: "b",
		start: 12,
	});
	for (const letter of ["", "!", "_", "1", "Bruckner", "a!", "ä", " A ", "B\n"]) {
		assert.deepEqual(parseLexiconIndexQuery(new URLSearchParams({ letter, start: "-2.5" })), {
			letter: "a",
			start: 1,
		});
	}
});

void test("search preserves query text, validates the field, and shares pagination defaults", () => {
	assert.deepEqual(parseLexiconSearchQuery(new URLSearchParams()), {
		q: "",
		field: "title",
		start: 1,
	});
	const q = ' "Anton Bruckner" & (Linz OR Wien) ';
	assert.deepEqual(
		parseLexiconSearchQuery(new URLSearchParams({ q, field: "all", start: "501" })),
		{ q, field: "all", start: 501 },
	);
	for (const field of ["", "title", "ALL", "invalid"]) {
		assert.deepEqual(parseLexiconSearchQuery(new URLSearchParams({ q, field, start: "0" })), {
			q,
			field: "title",
			start: 1,
		});
	}
});
