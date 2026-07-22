/* @jsxImportSource solid-js */
import { createUrl, createUrlSearchParams, log, request } from "@acdh-oeaw/lib";
import { createSignal, For, onMount } from "solid-js";

import { ensureArray } from "@/lib/ensure-array";
import { type AuthorSearchResponse, baseUrl } from "@/lib/lexicon";

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

	const url = createUrl({
		baseUrl,
		pathname: "/authors",
		searchParams: createUrlSearchParams({
			title: props.letter,
			startAt: props.start,
			max: props.max,
		}),
	});

	async function loadIndex() {
		try {
			const data = (await request(url, { responseType: "json" })) as AuthorSearchResponse;
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
						<For
							each={ensureArray(index()?.results.item).sort((a, b) => {
								const aSortLabel =
									a?.person.persName.find((item) => {
										return item.type === "sortName";
									})?.["#text"] ?? "";
								const bSortLabel =
									b?.person.persName.find((item) => {
										return item.type === "sortName";
									})?.["#text"] ?? "";
								return aSortLabel.localeCompare(bSortLabel);
							})}
						>
							{(author) => {
								const { id: _id, person } = author!;

								return (
									<li>
										<a
											class="underline"
											href={`/lexikon/autorinnen/${person.persName[1]["#text"]}`}
										>
											{person.persName[1]["#text"]}
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
