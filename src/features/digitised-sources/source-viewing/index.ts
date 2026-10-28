import mapping from "../data/siglum_wab_mapping.json";

const knownSigla = new Set(
	mapping.map((entry) => {
		return entry.Signatur;
	}),
);

export interface SourceSelection {
	source: "hss" | "ed" | "aga";
	siglum?: string | null;
	wabId?: string | null;
	aga?: string | null;
}

/** Empty strings mean no selection; explicit sigla take precedence over WAB filters. */
export function selectSource(selection: SourceSelection) {
	const { source, siglum, wabId, aga } = selection;
	let identifiers: Array<string>;
	if (source === "hss") {
		identifiers = siglum
			? [siglum]
			: mapping
					.filter((entry) => {
						return !wabId || entry.WAB.split(" ").includes(wabId);
					})
					.map((entry) => {
						return entry.Signatur;
					});
	} else {
		const identifier = source === "ed" ? wabId : aga;
		identifiers = identifier ? [identifier] : [];
	}
	// Catalog sigla include spaces, punctuation, and historical slash-separated identifiers.
	// Other selections must be single path segments, never URLs or relative paths. Some print
	// identifiers number their volumes after a comma, e.g. "WAB084,1".
	const valid = identifiers.every((identifier) => {
		return (
			(source === "hss" && knownSigla.has(identifier)) ||
			/^[\p{L}\p{N}_-][\p{L}\p{N}_.,-]*$/u.test(identifier)
		);
	});
	const path = source === "hss" ? "bruckner" : "bruckner/drucke";
	const manifests = valid
		? identifiers.map((identifier) => {
				return `https://iiifpresentation.acdh.oeaw.ac.at/${path}/${identifier.split("/").map(encodeURIComponent).join("/")}/manifest`;
			})
		: [];
	return {
		catalog:
			source === "hss"
				? manifests.map((manifestId) => {
						return { manifestId };
					})
				: [],
		windows: manifests[0]
			? [
					{
						loadedManifest: manifests[0],
						sidePanel: source === "aga",
						viewType: source === "hss" ? ("ThumbnailsView" as const) : ("ImageView" as const),
					},
				]
			: [],
	};
}

export type SourceView = ReturnType<typeof selectSource>;
