/* @jsxImportSource solid-js */
import { log } from "@acdh-oeaw/lib";
import { createSignal, For, onMount } from "solid-js";

import { type AuthorSearchResponse, lexicon } from "@/lib/lexicon";

interface LexiconAuthorsIndexProps {
	errorMessage: string;
	pendingMessage: string;
	letter: string;
	start: number;
	max: number;
}

export default function LexiconAuthorsIndex(props: LexiconAuthorsIndexProps) {
	const [index, setIndex] = createSignal<AuthorSearchResponse | null>(null);
	const [error, setError] = createSignal("");

	async function loadIndex() {
		try {
			const data = await lexicon.listAuthors({
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
						<For
							each={index()?.items.toSorted((a, b) => {
								return a.sortName.localeCompare(b.sortName);
							})}
						>
							{(author) => {
								const { name } = author;

								return (
									<li>
										<a class="underline" href={`/lexikon/autorinnen/${name}`}>
											{name}
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
