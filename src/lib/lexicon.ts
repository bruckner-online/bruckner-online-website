import * as v from "valibot";

export type Category = "Artikel" | "Autor" | "Literatur" | "Ort" | "Person" | "Sache" | "Werk";

export const baseUrl = "https://api-brucknerlex.acdh.oeaw.ac.at";

type ErrorKind = "network" | "timeout" | "http" | "invalid-response";

export class LexiconError extends Error {
	readonly kind: ErrorKind;
	readonly status?: number;
	constructor(kind: ErrorKind, options?: ErrorOptions, status?: number) {
		super(`Lexikon request failed: ${kind}`, options);
		this.name = "LexiconError";
		this.kind = kind;
		this.status = status;
	}
}

// XML-derived JSON uses an object for one result and an array for multiple results.
function list<T extends v.GenericSchema>(schema: T) {
	return v.pipe(
		v.nullish(v.union([v.array(schema), schema]), []),
		v.transform((value): Array<v.InferOutput<T>> => {
			return (Array.isArray(value) ? value : [value]) as Array<v.InferOutput<T>>;
		}),
	);
}

const text = v.object({ "#text": v.string() });
const article = v.object({ id: v.string(), title: v.string() });
const author = v.pipe(
	v.object({
		person: v.object({ persName: v.array(v.object({ type: v.string(), "#text": v.string() })) }),
	}),
	v.transform(({ person }) => {
		return {
			name:
				person.persName.find((name) => {
					return name.type === "full";
				})?.["#text"] ?? "",
			sortName:
				person.persName.find((name) => {
					return name.type === "sortName";
				})?.["#text"] ?? "",
		};
	}),
	v.check((author) => {
		return author.name.length > 0;
	}, "Missing author name"),
);
const literature = v.pipe(
	v.object({ full: v.object({ bibl: text }) }),
	v.transform((item) => {
		return item.full.bibl["#text"];
	}),
);
const searchArticle = v.pipe(
	v.object({
		id: v.string(),
		title: v.string(),
		kwic: v.object({ p: list(v.object({ span: v.tuple([text, text, text]) })) }),
	}),
	v.transform(({ id, title, kwic }) => {
		return {
			id,
			title,
			snippets: kwic.p.map(({ span }) => {
				return {
					before: span[0]["#text"],
					match: span[1]["#text"],
					after: span[2]["#text"],
				};
			}),
		};
	}),
);

function results<T extends v.GenericSchema>(key: string, schema: T) {
	return (data: unknown) => {
		const { results } = v.parse(v.object({ results: v.record(v.string(), v.unknown()) }), data);
		return {
			total: v.parse(
				v.pipe(
					v.union([v.string(), v.number()]),
					v.transform(Number),
					v.number(),
					v.integer(),
					v.minValue(0),
				),
				results.total,
			),
			items: v.parse(list(schema), results[key]),
		};
	};
}

interface Pagination {
	start: number;
	max: number;
}
interface IndexOptions extends Pagination {
	letter: string;
}

/** Owns the wire format and transport for both browser and server callers. */
export function createLexiconClient(options: { fetch?: typeof fetch; timeoutMs?: number } = {}) {
	async function load(
		path: string,
		params: Record<string, string | number | undefined>,
		html = false,
	) {
		const url = new URL(path, baseUrl);
		for (const [key, value] of Object.entries(params)) {
			if (value !== undefined) {
				url.searchParams.set(key, String(value));
			}
		}
		const signal = AbortSignal.timeout(options.timeoutMs ?? 15_000);
		try {
			const response = await (options.fetch ?? globalThis.fetch)(url, {
				signal,
				headers: { accept: html ? "text/*" : "application/json" },
			});
			if (!response.ok) {
				throw new LexiconError("http", undefined, response.status);
			}
			if (html) {
				return await response.text();
			}
			try {
				return (await response.json()) as unknown;
			} catch (cause) {
				if (signal.aborted) {
					throw cause;
				}
				throw new LexiconError("invalid-response", { cause });
			}
		} catch (cause) {
			if (cause instanceof LexiconError) {
				throw cause;
			}
			throw new LexiconError(signal.aborted ? "timeout" : "network", { cause });
		}
	}
	async function query<T>(
		path: string,
		params: Record<string, string | number | undefined>,
		parse: (data: unknown) => T,
	): Promise<T> {
		const data = await load(path, params);
		try {
			return parse(data);
		} catch (cause) {
			throw new LexiconError("invalid-response", { cause });
		}
	}

	return {
		async getArticle(id: string) {
			return (await load(`/article/${encodeURIComponent(id)}`, {}, true)) as string;
		},
		listArticles({
			letter,
			start,
			max,
			category,
			author,
		}: Partial<IndexOptions> & Pagination & { category?: string; author?: string }) {
			return query(
				"/article",
				{
					title: letter,
					startAt: start,
					max,
					category,
					author,
					showDependentSubarticles: author === undefined ? undefined : "yes",
				},
				results("article", article),
			);
		},
		listAuthors({ letter, start, max }: IndexOptions) {
			return query("/authors", { title: letter, startAt: start, max }, results("item", author));
		},
		listLiterature({ letter, start, max }: IndexOptions) {
			return query(
				"/literature",
				{ title: letter, startAt: start, max },
				results("item", literature),
			);
		},
		search({ q, field, start, max }: Pagination & { q: string; field: "title" | "all" }) {
			return query("/query", { q, field, startAt: start, max }, results("article", searchArticle));
		},
	};
}

export const lexicon = createLexiconClient();
export type ArticleSearchResponse = Awaited<ReturnType<typeof lexicon.listArticles>>;
export type AuthorSearchResponse = Awaited<ReturnType<typeof lexicon.listAuthors>>;
export type BibliographySearchResult = Awaited<ReturnType<typeof lexicon.listLiterature>>;
export type SearchResponse = Awaited<ReturnType<typeof lexicon.search>>;

export const pathnames: Record<Category, string> = {
	Artikel: "/lexikon/artikel/",
	Autor: "/lexikon/autorinnen/",
	Literatur: "/lexikon/literatur/",
	Ort: "/lexikon/orte/",
	Person: "/lexikon/personen/",
	Sache: "/lexikon/sachbegriffe/",
	Werk: "/lexikon/werke/",
};
