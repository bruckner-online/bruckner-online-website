import { expect, test } from "~/e2e/lib/test";

const documents = [
	{ id: "older", author: "Zeller", year: 1900, reference: "Bruckner: older publication" },
	{ id: "newer", author: "Adler", year: 2025, reference: "Bruckner: newer publication" },
];

interface SearchParameters {
	q: string;
	sort_by?: string;
	filter_by?: string;
	per_page?: number;
}

test("bibliography search derives year bounds and supports sorting and filtering", async ({
	page,
}) => {
	await page.route("**/multi_search*", async (route) => {
		const { searches } = route.request().postDataJSON() as { searches: Array<SearchParameters> };
		const results = searches.map((parameters) => {
			let matches = documents.filter((document) => {
				return (
					parameters.q === "*" ||
					document.reference.toLowerCase().includes(parameters.q.toLowerCase())
				);
			});
			// Apply the numeric range sent by the real Typesense adapter.
			const range = parameters.filter_by?.match(/year:=?\[(\d+)\.\.(\d+)\]/);
			if (range) {
				matches = matches.filter((document) => {
					return document.year >= Number(range[1]) && document.year <= Number(range[2]);
				});
			}
			const minimum = parameters.filter_by?.match(/year:>=(\d+)/);
			if (minimum) {
				matches = matches.filter((document) => {
					return document.year >= Number(minimum[1]);
				});
			}
			matches.sort((a, b) => {
				return parameters.sort_by?.startsWith("author:")
					? a.author.localeCompare(b.author)
					: a.year - b.year;
			});
			return {
				found: matches.length,
				out_of: documents.length,
				page: 1,
				search_time_ms: 1,
				request_params: { ...parameters, per_page: parameters.per_page ?? 50 },
				hits: matches.map((document) => {
					return { document, text_match: 1, highlights: [] };
				}),
				facet_counts: [{ field_name: "year", counts: [], stats: { min: 1900, max: 2025 } }],
			};
		});
		await route.fulfill({ json: { results } });
	});

	page.on("pageerror", (error) => {
		throw error;
	});
	await page.goto("/leben/bibliographie/");
	const years = page.locator("#year-range").getByRole("spinbutton");
	await expect(years.first()).toHaveAttribute("placeholder", "1900");
	await expect(years.last()).toHaveAttribute("placeholder", "2025");
	await expect(years.last()).toHaveAttribute("max", "2025");

	await page.locator("#searchbox").getByRole("searchbox").fill("Bruckner");
	const hits = page.locator("#hits").getByRole("listitem");
	await expect(hits).toHaveText([/older publication/, /newer publication/]);

	await page.locator("#sort-by").getByRole("combobox").selectOption({ index: 0 });
	await expect(hits).toHaveText([/newer publication/, /older publication/]);

	await years.first().fill("2020");
	await page.locator("#year-range").getByRole("button").click();
	await expect(hits).toHaveText([/newer publication/]);
});
