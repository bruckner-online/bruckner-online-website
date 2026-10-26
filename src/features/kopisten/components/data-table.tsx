/* @jsxImportSource solid-js */

import "simple-datatables/dist/style.css";

import { DataTable as SimpleDataTable } from "simple-datatables";
import { type JSX, onCleanup, onMount } from "solid-js";

import type { TableRows } from "@/features/kopisten/components/table-data";

interface DataTableProps {
	children: JSX.Element;
	labels: { search: string };
	/** All matching rows across pages; without a search, the complete table. */
	onRowsChange?: (rows: TableRows) => void;
}

export function DataTable(props: DataTableProps) {
	// Solid assigns this variable through the JSX ref attribute.
	// oxlint-disable-next-line no-unassigned-vars
	let containerRef: HTMLDivElement | undefined;
	let tableInstance: SimpleDataTable | undefined;

	onMount(() => {
		if (!containerRef) {
			return;
		}
		{
			const tableElement = containerRef.querySelector("table");
			if (!tableElement) {
				return;
			}

			try {
				tableInstance = new SimpleDataTable(tableElement, {
					classes: {
						table: "tables-striped mb-0",
						top: "datatable-top",
					},
					columns: [
						{
							select: 0,
							sort: "asc",
						},
					],
					labels: {
						info: "{start} bis {end} von {rows} Einträgen",
					},
					paging: true,
					perPage: 20,
					template(_DataTableConfiguration, _HTMLTableElement) {
						return `
        				<!-- Top section with search and controls -->
								<div class="p-4">
									<div class="grid grid-cols-[1fr_1fr_1fr]">
										<div>
											<label>${props.labels.search}
												<input class="datatable-input rounded-sm border px-3 py-1" type="search">
											</label>
										</div>
										<div class="datatable-info text-center"></div>
									</div>
									<div class="datatable-container"></div>
									<div class="flex justify-end mb-2">
										<nav class="datatable-pagination"></nav>
									</div>
									</div>
   			 			`;
					},
				});
				const instance = tableInstance;
				function publishRows(matched?: Array<number>) {
					const rows = instance.data.data;
					props.onRowsChange?.(
						matched === undefined
							? rows
							: matched.map((index) => {
									return rows[index]!;
								}),
					);
				}
				publishRows();
				// Search matches are row indices into the full dataset, not the rendered page.
				// Multisearch also fires when sorting a filtered table.
				instance.on(
					"datatable.multisearch",
					(queries: ReadonlyArray<unknown>, matched: Array<number>) => {
						publishRows(queries.length > 0 ? matched : undefined);
					},
				);
				instance.on("datatable.search", (query: string) => {
					if (query.length === 0) {
						publishRows();
					}
				});
			} catch (err) {
				console.error(err);
			}
		}
	});

	onCleanup(() => {
		tableInstance?.destroy();
	});

	return (
		<div class="min-h-1" ref={containerRef}>
			{props.children}
		</div>
	);
}
