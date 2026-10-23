/* @jsxImportSource solid-js */

import * as L from "leaflet";

import "leaflet.markercluster";

import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

import { type Accessor, createEffect, onMount } from "solid-js";

interface LeafletMapProps {
	coordinates: Accessor<Array<[number, number]>>;
	latLng: Accessor<[string, string]>;
	zoom: string;
}

export function LeafletMap(props: LeafletMapProps) {
	let markersLayer: L.MarkerClusterGroup;
	let leafletMap: L.Map;

	onMount(() => {
		const [lat, lng] = props.latLng();
		leafletMap = L.map("leaflet-map").setView([Number(lat), Number(lng)], Number(props.zoom));
		L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
			attribution:
				'Map data &amp;copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.openstreetmap.org/">OpenStreetMap</a>',
			maxZoom: 18,
			zIndex: 1,
		}).addTo(leafletMap);
		markersLayer = L.markerClusterGroup().addTo(leafletMap);
	});

	createEffect(() => {
		const coordinates = props.coordinates();
		markersLayer.clearLayers();
		coordinates.forEach((coord) => {
			if (!coord.some(Number.isNaN)) {
				const [lat, lng] = coord;
				L.marker([lat, lng]).addTo(markersLayer);
			}
		});
		const bounds = markersLayer.getBounds();
		if (bounds.isValid()) {
			leafletMap.fitBounds(markersLayer.getBounds());
		}
	});
	return <div id="leaflet-map" class="z-0 min-h-[300px]" />;
}
