import type { APIContext } from "astro";

import { lexicon, type Category } from "@/features/lexicon/client";
import { parseLexiconIndexQuery } from "@/features/lexicon/query";

/** Load in route frontmatter: nested components run after streaming starts. */
export async function loadLexiconIndex(
	context: Pick<APIContext, "cache" | "url">,
	options: { category?: Category; kind?: "articles" | "authors" | "literature" } = {},
) {
	const { category, kind = "articles" } = options;
	const { letter, start } = parseLexiconIndexQuery(context.url.searchParams);
	const query = { letter, start, max: 500 };
	const authors = kind === "authors" ? await lexicon.listAuthors(query) : undefined;
	const literature = kind === "literature" ? await lexicon.listLiterature(query) : undefined;
	const articles =
		kind === "articles" ? await lexicon.listArticles({ ...query, category }) : undefined;
	// Only successful responses may be reused; failures must remain retryable.
	if (context.cache.enabled && (authors ?? literature ?? articles)?.status === "ok") {
		context.cache.set({ maxAge: 600 });
	}
	return { letter, authors, literature, articles };
}
