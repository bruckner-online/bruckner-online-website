/* @jsxImportSource solid-js */

import { createSignal } from "solid-js";

import { DataTable } from "@/features/kopisten/components/data-table";

import { LeafletMap } from "./leaflet-map";

interface MapTableProps {
	children: HTMLDivElement;
	title?: string;
	labels: Record<string, unknown>;
	html: string;
}

const [coordinates, setCoordinates] = createSignal<Array<[number, number]>>([]);
const [initialLatLng, setInitialLatLng] = createSignal<[string, string]>(["", ""]);
const initialZoom = "2";

export function MapTable(props: MapTableProps) {
	return (
		<>
			<LeafletMap latLng={initialLatLng} zoom={initialZoom} coordinates={coordinates} />
			<DataTable
				labels={props.labels}
				setCoordinates={setCoordinates}
				setInitialLatLng={setInitialLatLng}
			>
				{props.children}
			</DataTable>
		</>
	);
}
