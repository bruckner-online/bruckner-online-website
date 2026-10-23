import { readFileSync } from "fs";

import { log } from "@acdh-oeaw/lib";
import { Errors } from "typesense";

import { createTypesenseClient } from "@/lib/typesense/typesense-client";
import { collectionSchema } from "@/lib/typesense/typesense-schema";

interface DBItem {
	Autor: string;
	Jahr: number;
	Bib_Zitat: string;
}

interface TypesenseDocument {
	author: string;
	year: number;
	reference: string;
	importedAt: number;
}

const client = createTypesenseClient(process.env.TYPESENSE_ADMIN_API_KEY);
const documents: Array<TypesenseDocument> = [];

const data = readFileSync("./src/data/bibliography_db_export_202506121637.json", "utf8");
const items = JSON.parse(data) as Array<DBItem>;

items.forEach((item: DBItem) => {
	const { Autor: author, Jahr: year, Bib_Zitat: reference } = item;
	const document: TypesenseDocument = {
		author: author,
		year,
		reference,
		importedAt: Date.now(),
	};
	documents.push(document);
});

try {
	await client.collections(process.env.PUBLIC_TYPESENSE_COLLECTION_NAME!).delete();
	log.info("Collection deleted");
} catch (error: unknown) {
	if (error instanceof Errors.ObjectNotFound) {
		log.error("Collection not found");
	} else {
		throw error;
	}
}

client
	.collections()
	.create(collectionSchema)
	.then(() => {
		log.info("Collection created");
	})
	.catch((error: unknown) => {
		throw error;
	});

await client
	.collections(process.env.PUBLIC_TYPESENSE_COLLECTION_NAME!)
	.documents()
	.import(documents, { action: "create" });
