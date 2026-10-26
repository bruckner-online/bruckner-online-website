import assert from "node:assert/strict";
import { test } from "node:test";

import { type ContactEmail, submitContact } from "../src/features/contact/submission.ts";

const valid = {
	name: "Test Author",
	email: "author@example.test",
	subject: "A question",
	message: "First line\nSecond line",
};

function request(fields: Record<string, string> = valid) {
	return new Request("https://example.test/kontakt", {
		method: "POST",
		body: new URLSearchParams(fields),
	});
}

void test("contact submission validates and delivers exactly one message with the original content", async () => {
	const sent: Array<ContactEmail> = [];
	const status = await submitContact(request({ ...valid, ignored: "extra field" }), {
		sendEmail: (message) => {
			sent.push(message);
			return Promise.resolve();
		},
	});
	assert.equal(status, "success");
	assert.deepEqual(sent, [
		{ from: "Test Author <author@example.test>", subject: valid.subject, text: valid.message },
	]);
});

void test("missing, empty, or invalid fields never reach email delivery", async () => {
	let sends = 0;
	const options = {
		sendEmail: () => {
			sends++;
			return Promise.resolve();
		},
	};
	for (const field of Object.keys(valid)) {
		const missing = Object.fromEntries(
			Object.entries(valid).filter(([key]) => {
				return key !== field;
			}),
		);
		assert.equal(
			await submitContact(request(missing), options),
			"invalid-input",
			`Missing ${field}`,
		);
		assert.equal(
			await submitContact(request({ ...valid, [field]: "" }), options),
			"invalid-input",
			`Empty ${field}`,
		);
	}
	assert.equal(
		await submitContact(request({ ...valid, email: "invalid" }), options),
		"invalid-input",
	);
	const data = new FormData();
	for (const [key, value] of Object.entries(valid)) {
		data.set(key, value);
	}
	data.set("message", new Blob(["file content"]), "message.txt");
	assert.equal(
		await submitContact(
			new Request("https://example.test/kontakt", { method: "POST", body: data }),
			options,
		),
		"invalid-input",
	);
	assert.equal(sends, 0);
});

void test("delivery failures return a recoverable outcome and a later submission can succeed", async () => {
	const logs: Array<unknown> = [];
	const options = {
		sendEmail: () => {
			return Promise.reject(new Error("SMTP unavailable"));
		},
		logger: {
			error: (message: unknown) => {
				logs.push(message);
			},
		},
	};
	assert.equal(await submitContact(request(), options), "unknown-error");
	assert.deepEqual(logs, ["SMTP unavailable"]);
	assert.equal(
		await submitContact(request(), {
			...options,
			sendEmail: () => {
				return Promise.resolve();
			},
		}),
		"success",
	);
});

void test("unreadable request bodies are handled without attempting delivery", async () => {
	let sends = 0;
	const logs: Array<unknown> = [];
	const status = await submitContact(
		{
			formData: () => {
				return Promise.reject(new TypeError("Malformed form body"));
			},
		},
		{
			sendEmail: () => {
				sends++;
				return Promise.resolve();
			},
			logger: {
				error: (message: unknown) => {
					logs.push(message);
				},
			},
		},
	);
	assert.equal(status, "unknown-error");
	assert.equal(sends, 0);
	assert.deepEqual(logs, ["Malformed form body"]);
});
