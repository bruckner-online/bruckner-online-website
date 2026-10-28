import type { Element, ElementContent, Root } from "hast";
import { SKIP, visit } from "unist-util-visit";

const marker = "■";

/**
 * Vita entries use a literal "■" as bullet, which Open Sans lacks, so browsers render a fallback
 * font glyph that sits off the baseline. Replace it with a decorative square drawn in CSS.
 */
export function withSquareMarkers() {
	return function transformer(tree: Root) {
		visit(tree, "text", (node, index, parent) => {
			if (parent == null || index == null || !node.value.includes(marker)) {
				return undefined;
			}

			const children: Array<ElementContent> = [];

			node.value.split(marker).forEach((value, idx) => {
				if (idx > 0) {
					children.push(createMarker());
				}
				if (value !== "") {
					children.push({ type: "text", value });
				}
			});

			parent.children.splice(index, 1, ...children);

			return [SKIP, index + children.length];
		});
	};
}

function createMarker(): Element {
	return {
		type: "element",
		tagName: "span",
		properties: {
			ariaHidden: "true",
			className: ["inline-block", "size-[0.6em]", "bg-current"],
		},
		children: [],
	};
}
