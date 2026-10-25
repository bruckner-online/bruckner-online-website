import assert from "node:assert/strict";
import { test } from "node:test";

import { withSearchAvailability } from "../src/features/bibliography/search-client.ts";
import { openViewer } from "../src/features/digitised-sources/viewer.ts";

void test("IIIF adapter reports unavailable responses and can recover on retry", async () => {
	let starts = 0;
	const logs: Array<unknown> = [];
	const options = {
		manifest: "https://example.org/manifest",
		start: () => {
			starts++;
			return Promise.resolve();
		},
		logger: {
			error: (...args: Array<unknown>) => {
				return logs.push(args);
			},
		},
	};
	for (const fetch of [
		() => {
			return Promise.resolve(new Response("unavailable", { status: 503 }));
		},
		() => {
			return Promise.resolve(new Response("not json"));
		},
		() => {
			return Promise.resolve(Response.json({ error: "missing" }));
		},
		() => {
			return Promise.reject(new TypeError("network"));
		},
	]) {
		assert.equal(await openViewer({ ...options, fetch }), false);
	}
	assert.equal(starts, 0);
	assert.equal(logs.length, 4);
	for (const manifest of [{ type: "Manifest", items: [] }, { sequences: [] }]) {
		assert.equal(
			await openViewer({
				...options,
				fetch: () => {
					return Promise.resolve(Response.json(manifest));
				},
			}),
			true,
		);
	}
	assert.equal(starts, 2);
	assert.equal(await openViewer({ ...options, manifest: undefined }), false);
	assert.equal(
		await openViewer({
			...options,
			fetch: () => {
				return Promise.resolve(Response.json({ sequences: [] }));
			},
			start: () => {
				return Promise.reject(new Error("module failed"));
			},
		}),
		false,
	);
});

void test("search failures remain rejected and a later successful search restores availability", async () => {
	let failing = true;
	const states: Array<boolean> = [];
	const logs: Array<unknown> = [];
	const error = new Error("HTTP 503");
	const client = withSearchAvailability(
		{
			search: (query: string) => {
				if (failing) {
					return Promise.reject(error);
				}
				return Promise.resolve({ results: [{ query, hits: [] }] });
			},
		},
		(available) => {
			return states.push(available);
		},
		{
			error: (...args: Array<unknown>) => {
				return logs.push(args);
			},
		},
	);
	await assert.rejects(client.search("Bruckner"), error);
	failing = false;
	assert.deepEqual(await client.search("Bruckner"), { results: [{ query: "Bruckner", hits: [] }] });
	assert.deepEqual(states, [false, true]);
	assert.equal(logs.length, 1);
});
