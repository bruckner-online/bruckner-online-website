/* @jsxImportSource solid-js */
import { createUrl, createUrlSearchParams, log, request } from "@acdh-oeaw/lib";
import { createSignal, For, onMount } from "solid-js";

import { ensureArray } from "@/lib/ensure-array";
import { type ArticleSearchResponse, baseUrl, pathnames } from "@/lib/lexicon";

interface LexiconIndexProps {
	errorMessage: string;
	pendingMessage: string;
	letter: string;
	max: number;
	start: number;
	category?: string;
}

export default function LexiconIndex(props: LexiconIndexProps) {
	const [index, setIndex] = createSignal<ArticleSearchResponse | null>(null);
	const [error, setError] = createSignal("");
	const searchParams = { title: props.letter, startAt: props.start, max: props.max };
	if (props.category) {
		Object.assign(searchParams, { category: props.category });
	}

	const url = createUrl({
		baseUrl,
		pathname: "/article",
		searchParams: createUrlSearchParams(searchParams),
	});

	async function loadIndex() {
		try {
			const data = (await request(url, { responseType: "json" })) as ArticleSearchResponse;
			setIndex(data);
		} catch (error) {
			log.error(error);
			setError(error instanceof Error ? error.message : props.errorMessage);
		}
	}

	onMount(() => {
		loadIndex().catch((err: unknown) => {
			console.error(err);
		});
	});

	return (
		<div>
			{!index() && !error() && <p role="status">{props.pendingMessage}</p>}
			{error() && <div>{error()}</div>}
			{index() && (
				<div class="grid gap-y-4">
					<ol class="grid" role="list">
						<For each={ensureArray(index()?.results.article)}>
							{(article) => {
								const { id, title } = article!;

								return (
									<li>
										<a class="underline" href={`${pathnames.Artikel}${id}`}>
											{title}
										</a>
									</li>
								);
							}}
						</For>
					</ol>
				</div>
			)}
		</div>
	);
}
