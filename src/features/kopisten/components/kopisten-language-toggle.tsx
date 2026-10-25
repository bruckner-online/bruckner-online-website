/* @jsxImportSource solid-js */

import { createSignal, For } from "solid-js";

type KopistenContentLanguages = "de" | "en";

interface KopistenLanguageToggleProps {
	languages: Array<KopistenContentLanguages>;
}

export function KopistenLanguageToggle(props: KopistenLanguageToggleProps) {
	const [language, setLanguage] = createSignal("de");

	const handler = (language: string) => {
		return () => {
			setLanguage(language);
			document.querySelectorAll(`body *[lang="${language}"]`).forEach((el) => {
				el.classList.remove("hidden");
			});
			document.querySelectorAll(`body *[lang]:not([lang="${language}"])`).forEach((el) => {
				el.classList.add("hidden");
			});
		};
	};

	return (
		<div class="flex justify-end space-x-4">
			<For each={props.languages}>
				{(lang) => {
					return (
						<button
							type="button"
							classList={{
								"hover:bg-neutral-50": true,
								"font-bold": true,
								"py-2": true,
								"px-4": true,
								"rounded-l": true,
								"bg-neutral-100": lang === language(),
							}}
							on:click={handler(lang)}
						>
							{lang.toLocaleUpperCase()}
						</button>
					);
				}}
			</For>
		</div>
	);
}
