import { type InferOk, Result } from "better-result";
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
// Empty XML snippet spans omit the text property in the API response.
const snippetText = v.object({ "#text": v.optional(v.string(), "") });
const searchArticle = v.pipe(
	v.object({
		id: v.string(),
		title: v.string(),
		kwic: v.object({
			p: list(v.object({ span: v.tuple([snippetText, snippetText, snippetText]) })),
		}),
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

function validate<T extends v.GenericSchema>(
	schema: T,
	data: unknown,
): Result<v.InferOutput<T>, LexiconError> {
	const parsed = v.safeParse(schema, data);
	return parsed.success
		? Result.ok(parsed.output)
		: Result.err(new LexiconError("invalid-response", { cause: parsed.issues }));
}

function results<T extends v.GenericSchema>(key: string, schema: T) {
	return (
		data: unknown,
	): Result<{ total: number; items: Array<v.InferOutput<T>> }, LexiconError> => {
		const envelope = validate(v.object({ results: v.record(v.string(), v.unknown()) }), data);
		if (envelope.status === "error") {
			return Result.err(envelope.error);
		}
		const total = validate(
			v.pipe(
				v.union([v.string(), v.number()]),
				v.transform(Number),
				v.number(),
				v.integer(),
				v.minValue(0),
			),
			envelope.value.results.total,
		);
		if (total.status === "error") {
			return Result.err(total.error);
		}
		const items = validate(list(schema), envelope.value.results[key]);
		if (items.status === "error") {
			return Result.err(items.error);
		}
		return Result.ok({ total: total.value, items: items.value });
	};
}

// Only failures from the fetch/body-read operations become recoverable results.
// Unexpected exceptions (including bugs in validation transforms) remain exceptions.
function transportFailure(
	cause: unknown,
	signal: AbortSignal,
	json = false,
): Result<never, LexiconError> {
	if (signal.aborted) {
		return Result.err(new LexiconError("timeout", { cause }));
	}
	if (json && cause instanceof SyntaxError) {
		return Result.err(new LexiconError("invalid-response", { cause }));
	}
	if (
		cause instanceof TypeError ||
		(cause instanceof DOMException && cause.name === "AbortError")
	) {
		return Result.err(new LexiconError("network", { cause }));
	}
	throw cause;
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
	async function load<T>(
		path: string,
		params: Record<string, string | number | undefined>,
		decode: (response: Response) => Promise<T>,
		accept: string,
	): Promise<Result<T, LexiconError>> {
		const url = new URL(path, baseUrl);
		for (const [key, value] of Object.entries(params)) {
			if (value !== undefined) {
				url.searchParams.set(key, String(value));
			}
		}
		const signal = AbortSignal.timeout(options.timeoutMs ?? 15_000);
		let response: Response;
		try {
			response = await (options.fetch ?? globalThis.fetch)(url, { signal, headers: { accept } });
		} catch (cause) {
			return transportFailure(cause, signal);
		}
		if (!response.ok) {
			return Result.err(new LexiconError("http", undefined, response.status));
		}
		try {
			return Result.ok(await decode(response));
		} catch (cause) {
			return transportFailure(cause, signal, accept === "application/json");
		}
	}
	async function query<T>(
		path: string,
		params: Record<string, string | number | undefined>,
		parse: (data: unknown) => Result<T, LexiconError>,
	): Promise<Result<T, LexiconError>> {
		const result = await load(
			path,
			params,
			async (response): Promise<unknown> => {
				return response.json();
			},
			"application/json",
		);
		if (result.status === "error") {
			return Result.err(result.error);
		}
		return parse(result.value);
	}

	return {
		async getArticle(id: string) {
			return load(
				`/article/${encodeURIComponent(id)}`,
				{},
				(response) => {
					return response.text();
				},
				"text/*",
			);
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
export type ArticleSearchResponse = InferOk<Awaited<ReturnType<typeof lexicon.listArticles>>>;
export type AuthorSearchResponse = InferOk<Awaited<ReturnType<typeof lexicon.listAuthors>>>;
export type BibliographySearchResult = InferOk<Awaited<ReturnType<typeof lexicon.listLiterature>>>;
export type SearchResponse = InferOk<Awaited<ReturnType<typeof lexicon.search>>>;

export const pathnames: Record<Category, string> = {
	Artikel: "/lexikon/artikel/",
	Autor: "/lexikon/autorinnen/",
	Literatur: "/lexikon/literatur/",
	Ort: "/lexikon/orte/",
	Person: "/lexikon/personen/",
	Sache: "/lexikon/sachbegriffe/",
	Werk: "/lexikon/werke/",
};
