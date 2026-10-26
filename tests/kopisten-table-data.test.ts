import assert from "node:assert/strict";
import { test } from "node:test";

import { getTableCoordinates } from "../src/features/kopisten/components/table-data.ts";

void test("place coordinates reject missing, nonfinite, and out-of-range values without losing valid zeroes", () => {
	const places: Array<Record<string, string>> = [
		{ "data-lat": "48.20568", "data-lng": "14.37836" },
		{ "data-lat": "0", "data-lng": "0" },
		{ "data-lat": " -90 ", "data-lng": "180" },
		{},
		{ "data-lat": "", "data-lng": "" },
		{ "data-lat": " ", "data-lng": "14" },
		{ "data-lat": "48" },
		{ "data-lat": "NaN", "data-lng": "14" },
		{ "data-lat": "Infinity", "data-lng": "14" },
		{ "data-lat": "91", "data-lng": "14" },
		{ "data-lat": "48", "data-lng": "-181" },
	];
	assert.deepEqual(
		getTableCoordinates([
			{
				cells: places.map((place) => {
					return { attributes: { "data-contenttype": "place", ...place } };
				}),
			},
			{ cells: [{ attributes: { "data-lat": "1", "data-lng": "2" } }, {}] },
		]),
		[
			[48.20568, 14.37836],
			[0, 0],
			[-90, 180],
		],
	);
	assert.deepEqual(getTableCoordinates([]), []);
});
