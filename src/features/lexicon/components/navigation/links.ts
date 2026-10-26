import type { createI18n } from "@/lib/i18n";

export function createLexiconLinks(t: Awaited<ReturnType<typeof createI18n>>["t"]) {
	return [
		{ href: "/lexikon", label: t("LexiconNav.links.home") },
		{ href: "/lexikon/projekt", label: t("LexiconNav.links.project") },
		{ href: "/lexikon/autorinnen", label: t("LexiconNav.links.authors") },
		{ href: "/lexikon/literatur", label: t("LexiconNav.links.bibliography") },
		{ href: "/lexikon/abkuerzungen", label: t("LexiconNav.links.abbreviations") },
	];
}
