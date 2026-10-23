import { assert, get, template } from "@acdh-oeaw/lib";
import type { Page } from "@playwright/test";
import type { Get, Paths } from "type-fest";

import { defaultLocale, type IntlMessages } from "@/config/i18n.config";
import type { createI18n as createIntl } from "@/lib/i18n";
import type de from "@/messages/de.json";

export interface I18n extends Awaited<ReturnType<typeof createIntl>> {}

export async function createI18n(_page: Page, locale = defaultLocale): Promise<I18n> {
	/**
	 * FIXME: Copying `@/lib/i18n.ts` because `playwright` does not handle json imports without
	 * import attribute, but `vite` fails to compile when they are added.
	 *
	 * @see https://github.com/microsoft/playwright/issues/23662
	 */
	// return createIntl(locale);

	const _messages = (await import(`@/messages/${locale}.json`, { with: { type: "json" } })) as {
		default: typeof de;
	};
	const metadata = await import("~/content/metadata.json", { with: { type: "json" } });
	const messages = { metadata: metadata.default, ..._messages.default } as IntlMessages;

	return {
		/** @see https://github.com/lukeed/rosetta/blob/master/src/index.js */
		t<T extends Paths<IntlMessages>>(
			// oxlint-disable-next-line typescript/no-invalid-void-type -- This callback must not depend on a receiver.
			this: void,
			key: T,
			params: Record<string, unknown> = {},
		): Get<IntlMessages, T> {
			const value = get(messages, key);

			assert(value != null, `Missing translation for ${key}.`);

			if (typeof value === "string") {
				return template(value, params) as Get<IntlMessages, T>;
			}

			return value as Get<IntlMessages, T>;
		},
	};
}

export type WithI18n<T> = T & { i18n: I18n };
