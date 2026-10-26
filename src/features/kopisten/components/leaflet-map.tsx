/* @jsxImportSource solid-js */

import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

import { type Accessor, createEffect, createResource, onCleanup, onMount } from "solid-js";

import { loadLeaflet } from "@/features/kopisten/components/leaflet-client";
import type { Coordinate } from "@/features/kopisten/components/table-data";

interface LeafletMapProps {
	coordinates: Accessor<Array<Coordinate>>;
}

export function LeafletMap(props: LeafletMapProps) {
	const [leaflet] = createResource(loadLeaflet);
	// Solid assigns this variable through the JSX ref attribute.
	// oxlint-disable-next-line no-unassigned-vars
	let containerRef: HTMLDivElement | undefined;

	onMount(() => {
		if (!containerRef) {
			return;
		}
		const container = containerRef;
		createEffect(() => {
			const L = leaflet();
			if (!L) {
				return;
			}
			const map = L.map(container).setView([0, 0], 2);
			onCleanup(() => {
				map.remove();
			});
			L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
				attribution:
					'Map data &amp;copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.openstreetmap.org/">OpenStreetMap</a>',
				maxZoom: 18,
				zIndex: 1,
			}).addTo(map);
			const markers = L.markerClusterGroup().addTo(map);
			createEffect(() => {
				markers.clearLayers();
				markers.addLayers(
					props.coordinates().map((coordinate) => {
						return L.marker(coordinate);
					}),
				);
				const bounds = markers.getBounds();
				if (bounds.isValid()) {
					map.fitBounds(bounds);
				}
			});
		});
	});
	return <div ref={containerRef} class="z-0 min-h-[300px]" />;
}
