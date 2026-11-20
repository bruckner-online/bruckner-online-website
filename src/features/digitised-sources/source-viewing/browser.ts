import { openViewer } from "../viewer";
import type { SourceView } from "./index";

/** Load Mirador only after the selected manifest passes the availability check. */
export function openSourceView(id: string, view: SourceView): Promise<boolean> {
	return openViewer({
		manifest: view.windows[0]?.loadedManifest ?? view.catalog[0]?.manifestId,
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
					) => unknown;
				};
			};
			Mirador.viewer({
				id,
				preserveManifestOrder: true,
				showAddFromURLBox: false,
				...view,
			});
		},
	});
}
