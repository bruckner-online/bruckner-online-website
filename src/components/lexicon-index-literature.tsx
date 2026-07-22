/* @jsxImportSource solid-js */
import { createUrl, createUrlSearchParams, log, request } from "@acdh-oeaw/lib";
import { createSignal, For, onMount } from "solid-js";

import { ensureArray } from "@/lib/ensure-array";
import { baseUrl, type BibliographySearchResult } from "@/lib/lexicon";

interface LexiconLiteratureIndexProps {
	errorMessage: string;
	pendingMessage: string;
	letter: string;
	start: number;
	max: number;
}

export default function LexiconLiteratureIndex(props: LexiconLiteratureIndexProps) {
	const [index, setIndex] = createSignal<BibliographySearchResult | null>(null);
	const [error, setError] = createSignal("");

	const url = createUrl({
		baseUrl,
		pathname: "/literature",
		searchParams: createUrlSearchParams({
			title: props.letter,
			startAt: props.start,
			max: props.max,
		}),
	});

	async function loadIndex() {
		try {
			const data = (await request(url, { responseType: "json" })) as BibliographySearchResult;
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
						<For each={ensureArray(index()?.results.item)}>
							{(item) => {
								const { full } = item!;

								return <li>{full.bibl["#text"]}</li>;
							}}
						</For>
					</ol>
				</div>
			)}
		</div>
	);
}
