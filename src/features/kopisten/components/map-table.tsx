/* @jsxImportSource solid-js */

import { createSignal, type JSX } from "solid-js";

import { DataTable } from "@/features/kopisten/components/data-table";
import { LeafletMap } from "@/features/kopisten/components/leaflet-map";
import { type Coordinate, getTableCoordinates } from "@/features/kopisten/components/table-data";

interface MapTableProps {
	children: JSX.Element;
	labels: { search: string };
}

export function MapTable(props: MapTableProps) {
	const [coordinates, setCoordinates] = createSignal<Array<Coordinate>>([]);
	return (
		<>
			<LeafletMap coordinates={coordinates} />
			<DataTable
				labels={props.labels}
				onRowsChange={(rows) => {
					setCoordinates(getTableCoordinates(rows));
				}}
			>
				{props.children}
			</DataTable>
		</>
	);
}
