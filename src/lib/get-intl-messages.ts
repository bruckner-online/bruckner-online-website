import type { IntlMessages, Locale } from "@/config/i18n.config";
import type de from "@/messages/de.json";

export async function getIntlMessages(locale: Locale): Promise<IntlMessages> {
	const messages = (await import(`../messages/${locale}.json`)) as typeof de;
	const metadata = await import("../../content/metadata.json");
	return { metadata, ...messages };
}
