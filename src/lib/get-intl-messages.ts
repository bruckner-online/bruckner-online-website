import type { IntlMessages, Locale } from "@/config/i18n.config";

export async function getIntlMessages(locale: Locale): Promise<IntlMessages> {
	const messages = await import(`../messages/${locale}.json`);
	const metadata = await import(`../../content/metadata.json`);
	return { metadata, ...messages };
}
