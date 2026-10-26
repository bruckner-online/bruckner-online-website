import * as Leaflet from "leaflet";
import markerIconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png?url";
import markerIconUrl from "leaflet/dist/images/marker-icon.png?url";
import markerShadowUrl from "leaflet/dist/images/marker-shadow.png?url";

// MarkerCluster is a legacy plugin: it extends a mutable global Leaflet object.
// Keep one shared library instance; map state remains local to each mounted map.
const leaflet = { ...Leaflet };
let ready: Promise<typeof leaflet> | undefined;

export function loadLeaflet() {
	ready ??= (async () => {
		// Leaflet's CSS-based URL detection cannot resolve Vite's bundled image assets.
		leaflet.Marker.mergeOptions({
			icon: leaflet.icon({
				iconUrl: markerIconUrl,
				iconRetinaUrl: markerIconRetinaUrl,
				shadowUrl: markerShadowUrl,
				iconSize: [25, 41],
				iconAnchor: [12, 41],
				popupAnchor: [1, -34],
				tooltipAnchor: [16, -28],
				shadowSize: [41, 41],
			}),
		});
		Object.assign(window, { L: leaflet });
		await import("leaflet.markercluster");
		return leaflet;
	})();
	return ready;
}
