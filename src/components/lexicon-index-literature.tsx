/* @jsxImportSource solid-js */
import { log } from "@acdh-oeaw/lib";
import { createSignal, For, onMount } from "solid-js";

import { lexicon, type BibliographySearchResult } from "@/lib/lexicon";

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

	async function loadIndex() {
		try {
			const data = await lexicon.listLiterature({
				letter: props.letter,
				start: props.start,
				max: props.max,
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
							{(item) => {
								return <li>{item}</li>;
							}}
						</For>
					</ol>
				</div>
			)}
		</div>
	);
}
