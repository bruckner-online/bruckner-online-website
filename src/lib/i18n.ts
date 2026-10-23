import { assert, get, template } from "@acdh-oeaw/lib";
import type { Get, Paths } from "type-fest";

import { defaultLocale, type IntlMessages } from "@/config/i18n.config";
import { getIntlMessages } from "@/lib/get-intl-messages";

export async function createI18n(locale = defaultLocale) {
	const messages = await getIntlMessages(locale);

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
