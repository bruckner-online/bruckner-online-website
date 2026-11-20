import { openViewer } from "../viewer";
import type { SourceView } from "./index";

const viewers = new Map<string, { unmount: () => void }>();

/**
 * Load Mirador only after the selected manifest passes the availability check. A resource list
 * has no single manifest to check; its entries report their own failures inside Mirador.
 */
export function openSourceView(id: string, view: SourceView): Promise<boolean> {
	return openViewer({
		manifest: view.windows[0]?.loadedManifest ?? (view.catalog.length > 0 ? false : undefined),
		start: async () => {
			// @ts-expect-error No type definitions available for mirador
			const module: unknown = await import("mirador");
			const { default: Mirador } = module as {
				default: {
					viewer: (
						options: SourceView & {
							id: string;
							preserveManifestOrder: boolean;
							showAddFromURLBox: boolean;
						},
					) => { unmount: () => void };
				};
			};
			// A retry after a failed start must not mount a second viewer into the same element.
			viewers.get(id)?.unmount();
			viewers.delete(id);
			const viewer = Mirador.viewer({
				id,
				preserveManifestOrder: true,
				showAddFromURLBox: false,
				...view,
			});
			viewers.set(id, viewer);
		},
	});
}
