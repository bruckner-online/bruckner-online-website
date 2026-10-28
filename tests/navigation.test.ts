import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

/** Collect `reference` values of `page` entries at any nesting depth. */
function collectPageReferences(value: unknown, references: Array<string> = []): Array<string> {
	if (Array.isArray(value)) {
		for (const item of value) {
			collectPageReferences(item, references);
		}
	} else if (value != null && typeof value === "object") {
		const entry = value as { discriminant?: unknown; value?: { reference?: unknown } };
		if (entry.discriminant === "page" && typeof entry.value?.reference === "string") {
			references.push(entry.value.reference);
		}
		for (const child of Object.values(value)) {
			collectPageReferences(child, references);
		}
	}
	return references;
}

void test("navigation only links to existing pages", () => {
	// Renaming a page in Keystatic does not update navigation entries referencing it.
	const navigation: unknown = JSON.parse(readFileSync("content/navigation.json", "utf8"));
	const references = collectPageReferences(navigation);
	assert.ok(references.length > 0);
	const missing = references.filter((reference) => {
		return ![`${reference}.mdx`, `${reference}/index.mdx`].some((path) => {
			return existsSync(join("content/pages", path));
		});
	});
	assert.deepEqual(missing, []);
});
