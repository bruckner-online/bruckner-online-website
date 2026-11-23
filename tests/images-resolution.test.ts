import assert from "node:assert/strict";
import { test } from "node:test";

import { capResolution } from "../src/scripts/images/resolution.ts";

void test("images within the limit are left unchanged", () => {
	assert.equal(capResolution(5000, 10_000), null);
	assert.equal(capResolution(1180, 800), null);
});

void test("larger images are downscaled to fit the limit, keeping the aspect ratio", () => {
	for (const [width, height] of [
		[8505, 11_750],
		[11_811, 4736],
		[9922, 10_078],
		[10_001, 5000],
		[100_000, 501],
	] as const) {
		const capped = capResolution(width, height);
		assert.ok(capped != null);
		assert.ok(capped.width * capped.height <= 50_000_000, `${String(width)}×${String(height)}`);
		assert.ok(capped.width * capped.height > 49_900_000, "should use most of the limit");
		assert.ok(Math.abs(capped.width / capped.height - width / height) < 0.01 * (width / height));
	}
});

void test("the limit is configurable", () => {
	assert.deepEqual(capResolution(2000, 1000, 1), { width: 1414, height: 707 });
});
