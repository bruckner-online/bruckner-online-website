/* @jsxImportSource solid-js */
import { log } from "@acdh-oeaw/lib";
import { createSignal, For, onMount } from "solid-js";

import { type ArticleSearchResponse, lexicon, pathnames } from "@/lib/lexicon";

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

	async function loadIndex() {
		try {
			const data = await lexicon.listArticles({
				letter: props.letter,
				start: props.start,
				max: props.max,
				category: props.category,
			});
			setIndex(data);
		} catch (error) {
			log.error(error);
			setError(props.errorMessage);
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
						<For each={index()?.items}>
							{(article) => {
								const { id, title } = article;

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
