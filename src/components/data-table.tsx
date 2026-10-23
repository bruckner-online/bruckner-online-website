/* @jsxImportSource solid-js */

import "simple-datatables/dist/style.css";

import { DataTable as SimpleDataTable } from "simple-datatables";
import { type JSX, onCleanup, onMount, type Setter } from "solid-js";

interface DataTableProps {
	children: JSX.Element;
	labels: Record<string, unknown>;
	setCoordinates?: Setter<Array<[number, number]>>;
	setInitialLatLng?: Setter<[string, string]>;
	alphabeticalFilter?: boolean;
}

export function DataTable(props: DataTableProps) {
	// Solid assigns this variable through the JSX ref attribute.
	// oxlint-disable-next-line no-unassigned-vars
	let containerRef: HTMLDivElement | undefined;
	let tabulatorInstance: SimpleDataTable | undefined;

	onMount(() => {
		if (!containerRef) return;
		{
			const tableElement = containerRef.querySelector("table");
			if (!tableElement) return;
			if (props.setCoordinates) {
				filterCoordinates(tableElement);
			}

			const firstPlaceCell: HTMLTableCellElement | null = tableElement.querySelector(
				"tbody td[data-contenttype='place']",
			);
			if (firstPlaceCell) {
				const { lat, lng } = firstPlaceCell.dataset;
				if (lat && lng && props.setInitialLatLng) {
					props.setInitialLatLng([lat, lng]);
				}
			}

			try {
				tabulatorInstance = new SimpleDataTable(tableElement, {
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
											<label htmlFor="search-input">${String(props.labels.search)}</label>
												<input class="datatable-input rounded-sm border px-3 py-1"  type='search'>
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
				if (props.setCoordinates) {
					tabulatorInstance.on("datatable.search", (_query, _matched) => {
						filterCoordinates(tableElement);
					});
				}
			} catch (err) {
				console.error(err);
			}
		}
	});

	onCleanup(() => {
		tabulatorInstance?.destroy();
	});

	function filterCoordinates(table: HTMLTableElement) {
		const filteredCoordinates: Array<[number, number]> = [];
		props.setCoordinates!([]);
		table.querySelectorAll("tbody td[data-contenttype='place']").forEach((el) => {
			const { lat, lng } = (el as HTMLElement).dataset;
			const poi: [number, number] = [Number(lat), Number(lng)];
			filteredCoordinates.push(poi);
		});
		props.setCoordinates!(filteredCoordinates);
	}

	return (
		<div class="min-h-1" ref={containerRef}>
			{props.children}
		</div>
	);
}
