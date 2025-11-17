/* @jsxImportSource solid-js */

import { For } from "solid-js";

import editionIndex from "@/edition/edition_index.json";

interface CopyistSelectProps {
	name: string;
	selectedValue: string;
}

export default function CopyistSelect(props: CopyistSelectProps) {
	return (
		<select
			data-kopisten-select
			name={props.name}
			class="w-full rounded-md bg-white p-2.5"
			onChange={(e) => {
				return (e.currentTarget as HTMLSelectElement).form?.submit();
			}}
		>
			<option disabled selected hidden>
				Kopist auswählen
			</option>
			<For each={editionIndex}>
				{(editionItem) => {
					const { id, copyist_name: copyistName } = editionItem;
					return (
						<option value={id} selected={props.selectedValue === id}>
							{copyistName}
						</option>
					);
				}}
			</For>
		</select>
	);
}
