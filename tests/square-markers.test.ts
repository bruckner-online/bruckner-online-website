import assert from "node:assert/strict";
import { test } from "node:test";

import type { Root } from "hast";

import { withSquareMarkers } from "../src/lib/content/square-markers.ts";

void test("square bullets are replaced with decorative markers", () => {
	const tree: Root = {
		type: "root",
		children: [
			{
				type: "element",
				tagName: "p",
				properties: {},
				children: [{ type: "text", value: "■ 4. September: Geburt.\n■ 1832: Schule." }],
			},
		],
	};
	withSquareMarkers()(tree);
	const paragraph = tree.children[0]!;
	assert.equal(paragraph.type, "element");
	assert.deepEqual(
		paragraph.children.map((child) => {
			if (child.type === "element") {
				return child.properties.ariaHidden;
			}
			return child.type === "text" ? child.value : null;
		}),
		["true", " 4. September: Geburt.\n", "true", " 1832: Schule."],
	);
});
