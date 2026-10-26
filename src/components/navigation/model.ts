import type { Navigation } from "@/lib/content/types";

export interface NavigationLink {
	kind: "link";
	label: string;
	href: string;
	isActive: boolean;
}

interface NavigationSeparator {
	kind: "separator";
}

export interface NavigationSection {
	kind: "section";
	id: string;
	label: string;
	links: Array<NavigationLink | NavigationSeparator>;
}

export interface NavigationMenu {
	kind: "menu";
	id: string;
	label: string;
	links: Array<NavigationLink | NavigationSeparator | NavigationSection>;
}

type SourceEntry = Navigation["links"][number];
type SourceMenu = Extract<SourceEntry, { discriminant: "menu" }>;
type SourceMenuEntry = SourceMenu["value"]["links"][number];
type SourceLeaf = Exclude<SourceMenuEntry, { discriminant: "section" }>;

function normalizeLink(
	entry: Exclude<SourceLeaf, { discriminant: "separator" }>,
	pathname: string,
): NavigationLink {
	const href = entry.discriminant === "page" ? `/${entry.value.reference}` : entry.value.href;
	return {
		kind: "link",
		label: entry.value.label,
		href,
		isActive: href.startsWith("/") && (pathname === href || pathname.startsWith(`${href}/`)),
	};
}

function normalizeLeaf(entry: SourceLeaf, pathname: string): NavigationLink | NavigationSeparator {
	return entry.discriminant === "separator"
		? { kind: "separator" }
		: normalizeLink(entry, pathname);
}

/** Resolve CMS references once for both desktop and mobile, with IDs independent of labels. */
export function normalizeNavigation(
	navigation: Navigation,
	pathname: string,
): Array<NavigationLink | NavigationMenu> {
	return navigation.links.map((entry, index) => {
		if (entry.discriminant !== "menu") {
			return normalizeLink(entry, pathname);
		}
		const id = `primary-navigation-${String(index)}`;
		return {
			kind: "menu",
			id,
			label: entry.value.label,
			links: entry.value.links.map((item, childIndex) => {
				if (item.discriminant !== "section") {
					return normalizeLeaf(item, pathname);
				}
				return {
					kind: "section",
					id: `${id}-section-${String(childIndex)}`,
					label: item.value.label,
					links: item.value.links.map((link) => {
						return normalizeLeaf(link, pathname);
					}),
				};
			}),
		};
	});
}
