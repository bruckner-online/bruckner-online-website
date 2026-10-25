import type { CollectionCreateSchema } from "typesense/lib/Typesense/Collections";

export const collectionSchema: CollectionCreateSchema = {
	name: process.env.PUBLIC_TYPESENSE_COLLECTION_NAME!,
	fields: [
		{
			name: "reference",
			type: "string",
			facet: false,
		},
		{
			name: "author",
			type: "string",
			facet: true,
			optional: true,
			sort: true,
		},
		{
			name: "year",
			type: "int32",
			facet: true,
			optional: true,
		},
	],
};
