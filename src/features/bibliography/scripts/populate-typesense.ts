import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";

import { log } from "@acdh-oeaw/lib";
import { Client, Errors } from "typesense";
import * as v from "valibot";

import { collectionSchema } from "@/features/bibliography/typesense-schema";

async function main(): Promise<void> {
	const nonEmptyString = v.pipe(v.string(), v.trim(), v.nonEmpty());
	const environment = v.parse(
		v.object({
			TYPESENSE_ADMIN_API_KEY: nonEmptyString,
			PUBLIC_TYPESENSE_COLLECTION_NAME: nonEmptyString,
			PUBLIC_TYPESENSE_HOST: nonEmptyString,
			PUBLIC_TYPESENSE_PORT: v.pipe(
				v.string(),
				v.transform(Number),
				v.number(),
				v.integer(),
				v.minValue(1),
				v.maxValue(65535),
			),
			PUBLIC_TYPESENSE_PROTOCOL: v.picklist(["http", "https"]),
		}),
		process.env,
	);

	const items = v.parse(
		v.pipe(
			v.array(
				v.object({
					Autor: v.nullable(v.string()),
					Jahr: v.nullable(
						v.pipe(v.number(), v.integer(), v.minValue(-2147483648), v.maxValue(2147483647)),
					),
					Bib_Zitat: nonEmptyString,
				}),
			),
			v.minLength(1),
		),
		JSON.parse(
			readFileSync(
				new URL("../data/bibliography_db_export_202506121637.json", import.meta.url),
				"utf8",
			),
		),
	);
	const importedAt = Date.now();
	const documents = items.map(({ Autor, Jahr, Bib_Zitat }) => {
		return {
			...(Autor === null ? {} : { author: Autor }),
			...(Jahr === null ? {} : { year: Jahr }),
			reference: Bib_Zitat,
			importedAt,
		};
	});

	const client = new Client({
		apiKey: environment.TYPESENSE_ADMIN_API_KEY,
		nodes: [
			{
				host: environment.PUBLIC_TYPESENSE_HOST,
				port: environment.PUBLIC_TYPESENSE_PORT,
				protocol: environment.PUBLIC_TYPESENSE_PROTOCOL,
			},
		],
		connectionTimeoutSeconds: 10,
	});
	const alias = environment.PUBLIC_TYPESENSE_COLLECTION_NAME;

	// A physical collection cannot be replaced with an alias of the same name safely.
	try {
		await client.aliases(alias).retrieve();
	} catch (error: unknown) {
		if (!(error instanceof Errors.ObjectNotFound)) {
			throw error;
		}
		let collectionExists = false;
		try {
			await client.collections(alias).retrieve();
			collectionExists = true;
		} catch (error: unknown) {
			if (!(error instanceof Errors.ObjectNotFound)) {
				throw error;
			}
		}
		if (collectionExists) {
			throw new Error(
				`${alias} is a physical collection. Choose a new PUBLIC_TYPESENSE_COLLECTION_NAME for the search alias and update the frontend configuration after indexing. The existing collection has been preserved.`,
			);
		}
	}

	const collectionName = `${alias}_${String(importedAt)}_${randomUUID()}`;
	await client.collections().create({ ...collectionSchema, name: collectionName });
	log.info(`Created collection ${collectionName}`);

	// Retain staged collections on failure: an alias update may have succeeded even if
	// its response was lost. Never delete a collection that might be serving searches.
	const results = await client
		.collections(collectionName)
		.documents()
		.import(documents, { action: "create" });
	const failures = results.filter((result) => {
		return !result.success;
	});
	if (results.length !== documents.length || failures.length > 0) {
		throw new Error(
			`Import incomplete: ${String(failures.length)} failures across ${String(results.length)} results for ${String(documents.length)} documents. Alias unchanged; inspect staged collection ${collectionName}.`,
		);
	}
	await client.aliases().upsert(alias, { collection_name: collectionName });
	log.info(`Published ${String(documents.length)} documents through alias ${alias}`);
}

main().catch((error: unknown) => {
	log.error(error);
	process.exitCode = 1;
});
