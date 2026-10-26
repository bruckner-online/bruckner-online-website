/** Missing or malformed offsets fall back to the first result (the API is 1-based). */
export function parseLexiconPagination(params: URLSearchParams) {
	const value = params.get("start");
	const start = Number(value);
	return {
		start: Number.isSafeInteger(start) && start > 0 && String(start) === value ? start : 1,
	};
}

/** Index filters correspond to the A–Z alphabet links. */
export function parseLexiconIndexQuery(params: URLSearchParams) {
	const value = params.get("letter");
	return {
		letter: value?.length === 1 && /[a-z]/i.test(value) ? value.toLowerCase() : "a",
		...parseLexiconPagination(params),
	};
}

export function parseLexiconSearchQuery(params: URLSearchParams) {
	return {
		q: params.get("q") ?? "",
		field: params.get("field") === "all" ? ("all" as const) : ("title" as const),
		...parseLexiconPagination(params),
	};
}
