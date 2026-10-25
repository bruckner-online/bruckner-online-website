/** Check the initial manifest before starting Mirador. Subsequent image failures belong to Mirador. */
export async function openViewer(options: {
	manifest?: string;
	start: () => Promise<void>;
	fetch?: typeof fetch;
	logger?: Pick<Console, "error">;
}): Promise<boolean> {
	try {
		if (!options.manifest) {
			throw new Error("No IIIF manifest selected");
		}
		const response = await (options.fetch ?? fetch)(options.manifest, {
			signal: AbortSignal.timeout(15_000),
			headers: { accept: "application/ld+json, application/json" },
		});
		if (!response.ok) {
			throw new Error(`IIIF manifest HTTP ${String(response.status)}`);
		}
		const manifest: unknown = await response.json();
		if (
			!manifest ||
			typeof manifest !== "object" ||
			!(
				("type" in manifest &&
					manifest.type === "Manifest" &&
					"items" in manifest &&
					Array.isArray(manifest.items)) ||
				("sequences" in manifest && Array.isArray(manifest.sequences))
			)
		) {
			throw new Error("Invalid IIIF manifest");
		}
		await options.start();
		return true;
	} catch (error) {
		(options.logger ?? console).error("IIIF viewer unavailable", {
			manifest: options.manifest,
			error,
		});
		return false;
	}
}
