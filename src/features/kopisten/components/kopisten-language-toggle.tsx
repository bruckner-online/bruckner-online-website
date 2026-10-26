/* @jsxImportSource solid-js */

import "@/features/kopisten/components/kopisten-language-toggle.css";

import { createSignal, For } from "solid-js";

type KopistenContentLanguages = "de" | "en";

interface KopistenLanguageToggleProps {
	languages: Array<KopistenContentLanguages>;
	contentId: string;
}

export function KopistenLanguageToggle(props: KopistenLanguageToggleProps) {
	const [language, setLanguage] = createSignal("de");

	function selectLanguage(next: KopistenContentLanguages) {
		const content = document.getElementById(props.contentId);
		if (content) {
			content.dataset.kopistenLanguage = next;
			setLanguage(next);
		}
	}

	return (
		<div class="flex justify-end space-x-4">
			<For each={props.languages}>
				{(lang) => {
					return (
						<button
							type="button"
							aria-controls={props.contentId}
							aria-pressed={lang === language()}
							classList={{
								"hover:bg-neutral-50": true,
								"font-bold": true,
								"py-2": true,
								"px-4": true,
								"rounded-l": true,
								"bg-neutral-100": lang === language(),
							}}
							onClick={() => {
								selectLanguage(lang);
							}}
						>
							{lang.toLocaleUpperCase()}
						</button>
					);
				}}
			</For>
		</div>
	);
}
