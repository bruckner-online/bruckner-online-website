/** Preserve rejected searches so InstantSearch never presents an outage as zero hits. */
export function withSearchAvailability<
	T extends { search: (...args: Array<never>) => Promise<unknown> },
>(
	client: T,
	onAvailability: (available: boolean) => void,
	logger: Pick<Console, "error"> = console,
): T {
	return {
		...client,
		async search(...args: Parameters<T["search"]>) {
			try {
				const response = await client.search(...args);
				onAvailability(true);
				return response;
			} catch (error) {
				logger.error("Typesense search unavailable", error);
				onAvailability(false);
				throw error;
			}
		},
	};
}
