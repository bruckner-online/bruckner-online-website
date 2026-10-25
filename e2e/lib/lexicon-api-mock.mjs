// Loaded only by Playwright's standalone server, never by the production entrypoint.
const upstreamFetch = globalThis.fetch;
const origin = "https://api-brucknerlex.acdh.oeaw.ac.at";

/** @param {RequestInfo | URL} input
 * @param {RequestInit} [init]
 */
globalThis.fetch = (input, init) => {
	const url = new URL(input instanceof Request ? input.url : input);
	if (url.origin !== origin) {
		return upstreamFetch(input, init);
	}

	const params = Object.fromEntries(url.searchParams);
	const marker = JSON.stringify(params);
	if (params.title === "e") {
		return Promise.resolve(Response.json({ error: "Unavailable" }, { status: 503 }));
	}
	if (params.title === "z") {
		return Promise.resolve(Response.json({ results: { total: "0" } }));
	}

	let results;
	if (url.pathname === "/article") {
		results = { total: "1", article: { id: "test-article", title: `Test article ${marker}` } };
	} else if (url.pathname === "/authors") {
		results = {
			total: "2",
			item: [
				{
					person: {
						persName: [
							{ type: "sortName", "#text": "Zeller" },
							{ type: "full", "#text": `Anna Zeller ${marker}` },
						],
					},
				},
				{
					person: {
						persName: [
							{ type: "sortName", "#text": "Adler" },
							{ type: "full", "#text": `Zoe Adler ${marker}` },
						],
					},
				},
			],
		};
	} else if (url.pathname === "/literature") {
		results = { total: "1", item: { full: { bibl: { "#text": `Test citation ${marker}` } } } };
	} else {
		return Promise.resolve(new Response("Unexpected Lexikon endpoint", { status: 404 }));
	}
	return Promise.resolve(Response.json({ results }));
};
