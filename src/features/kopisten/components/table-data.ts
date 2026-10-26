/** Cell attributes retained by the table adapter, including generated place metadata. */
export type TableRows = ReadonlyArray<{
	cells: ReadonlyArray<{ attributes?: Record<string, string> }>;
}>;

export type Coordinate = [number, number];

/** Ignore absent and malformed locations while retaining valid zero coordinates. */
export function getTableCoordinates(rows: TableRows): Array<Coordinate> {
	const coordinates: Array<Coordinate> = [];
	for (const row of rows) {
		for (const { attributes } of row.cells) {
			if (attributes?.["data-contenttype"] !== "place") {
				continue;
			}
			const lat = attributes["data-lat"]?.trim();
			const lng = attributes["data-lng"]?.trim();
			if (!lat || !lng) {
				continue;
			}
			const latitude = Number(lat);
			const longitude = Number(lng);
			if (
				Number.isFinite(latitude) &&
				Number.isFinite(longitude) &&
				Math.abs(latitude) <= 90 &&
				Math.abs(longitude) <= 180
			) {
				coordinates.push([latitude, longitude]);
			}
		}
	}
	return coordinates;
}
