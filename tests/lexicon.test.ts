import assert from "node:assert/strict";
import { test } from "node:test";

import type { Result } from "better-result";

import { createLexiconClient, LexiconError } from "../src/lib/lexicon.ts";

async function success<T>(request: Promise<Result<T, LexiconError>>) {
	const result = await request;
	if (result.status === "error") {
		assert.fail(result.error.message);
	}
	return result.value;
}

function fixture(body: unknown, inspect?: (url: URL) => void) {
	return createLexiconClient({
		fetch: (input, init) => {
			assert.equal(new Headers(init?.headers).get("accept"), "application/json");
			inspect?.(new URL(input instanceof Request ? input.url : input));
			return Promise.resolve(Response.json(body));
		},
	});
}

void test("article lists preserve filters and normalise singleton results", async () => {
	const client = fixture(
		{ results: { total: "1", article: { id: "a", title: "Article" } } },
		(url) => {
			assert.equal(url.pathname, "/article");
			assert.deepEqual(Object.fromEntries(url.searchParams), {
				title: "b",
				startAt: "12",
				max: "500",
				category: "Person",
				author: "A & B",
				showDependentSubarticles: "yes",
			});
		},
	);
	assert.deepEqual(
		await success(
			client.listArticles({
				letter: "b",
				start: 12,
				max: 500,
				category: "Person",
				author: "A & B",
			}),
		),
		{ total: 1, items: [{ id: "a", title: "Article" }] },
	);
});

void test("empty results normalise missing and null collections", async () => {
	for (const article of [undefined, null, []]) {
		assert.deepEqual(
			await success(
				fixture({ results: { total: "0", article } }).listArticles({ start: 1, max: 500 }),
			),
			{ total: 0, items: [] },
		);
	}
});

void test("authors use named fields rather than position", async () => {
	const client = fixture({
		results: {
			total: "1",
			item: {
				person: {
					persName: [
						{ type: "full", "#text": "Full" },
						{ type: "sortName", "#text": "Sort" },
					],
				},
			},
		},
	});
	assert.deepEqual(await success(client.listAuthors({ letter: "a", start: 1, max: 500 })), {
		total: 1,
		items: [{ name: "Full", sortName: "Sort" }],
	});
});

void test("literature and search hide XML-derived structures", async () => {
	assert.deepEqual(
		await success(
			fixture({
				results: { total: "1", item: { full: { bibl: { "#text": "Citation" } } } },
			}).listLiterature({ letter: "a", start: 1, max: 500 }),
		),
		{ total: 1, items: ["Citation"] },
	);
	const result = await success(
		fixture({
			results: {
				total: "1",
				article: {
					id: "a",
					title: "A",
					kwic: {
						p: { span: [{ "#text": "before" }, { "#text": "match" }, { "#text": "after" }] },
					},
				},
			},
		}).search({ q: "A & B", field: "all", start: 1, max: 500 }),
	);
	assert.deepEqual(result.items[0]?.snippets, [
		{ before: "before", match: "match", after: "after" },
	]);
});

void test("article HTML is preserved and identifiers are encoded", async () => {
	const client = createLexiconClient({
		fetch: (input, init) => {
			assert.equal(new Headers(init?.headers).get("accept"), "text/*");
			assert.equal(
				new URL(input instanceof Request ? input.url : input).pathname,
				"/article/a%2Fb%3F",
			);
			return Promise.resolve(new Response("<p>Article</p>"));
		},
	});
	assert.equal(await success(client.getArticle("a/b?")), "<p>Article</p>");
});

void test("failures are classified at the integration seam", async () => {
	const cases: Array<[typeof fetch, string]> = [
		[
			() => {
				return Promise.resolve(new Response("unavailable", { status: 503 }));
			},
			"http",
		],
		[
			() => {
				return Promise.reject(new TypeError("offline"));
			},
			"network",
		],
		[
			() => {
				return Promise.resolve(new Response("not json"));
			},
			"invalid-response",
		],
		[
			() => {
				return Promise.resolve(Response.json({ results: { total: "bad" } }));
			},
			"invalid-response",
		],
		[
			(_input, init) => {
				return new Promise((_resolve, reject) => {
					const signal = init!.signal!;
					const timer = setTimeout(() => {
						reject(new Error("Test timeout did not abort"));
					}, 100);
					signal.addEventListener(
						"abort",
						() => {
							clearTimeout(timer);
							reject(new Error("Aborted"));
						},
						{ once: true },
					);
				});
			},
			"timeout",
		],
	];
	for (const [fetch, kind] of cases) {
		const result = await createLexiconClient({ fetch, timeoutMs: 10 }).listArticles({
			start: 1,
			max: 500,
		});
		assert.equal(result.status, "error");
		assert.ok(result.error instanceof LexiconError);
		assert.equal(result.error.kind, kind);
		if (kind === "http") {
			assert.equal(result.error.status, 503);
		}
	}
});

void test("unexpected exceptions are not converted into integration failures", async () => {
	const defect = new Error("Programming defect");
	const client = createLexiconClient({
		fetch: () => {
			throw defect;
		},
	});
	await assert.rejects(client.listArticles({ start: 1, max: 500 }), (error) => {
		return error === defect;
	});
});

void test("malformed nested responses return validation errors", async () => {
	const client = fixture({ results: { total: "1", article: { id: "a", title: 123 } } });
	const result = await client.listArticles({ start: 1, max: 500 });
	assert.equal(result.status, "error");
	assert.equal(result.error.kind, "invalid-response");
});

void test("search accepts omitted text in empty snippet spans", async () => {
	const client = fixture({
		results: {
			total: "1",
			article: {
				id: "d1e4915",
				title: "Bruckner-Gesellschaften",
				kwic: {
					p: [
						{
							span: [
								{ class: "previous" },
								{ class: "hi", "#text": "Bruckner" },
								{ class: "following", "#text": "-Gesellschaften" },
							],
						},
						{
							span: [
								{ class: "previous", "#text": "Anton " },
								{ class: "hi", "#text": "Bruckner" },
								{ class: "following" },
							],
						},
					],
				},
			},
		},
	});
	const result = await success(client.search({ q: "Bruckner", field: "title", start: 1, max: 10 }));
	assert.deepEqual(result.items[0]?.snippets, [
		{ before: "", match: "Bruckner", after: "-Gesellschaften" },
		{ before: "Anton ", match: "Bruckner", after: "" },
	]);
});
