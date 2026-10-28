import { createUrl, createUrlSearchParams } from "@acdh-oeaw/lib";

import { env } from "@/config/env.config";
import type { Locale } from "@/config/i18n.config";

export function createImprintUrl(locale: Locale): URL {
	return createUrl({
		baseUrl: env.PUBLIC_IMPRINT_SERVICE_BASE_URL,
		pathname: `/${String(env.PUBLIC_REDMINE_ID)}`,
		searchParams: createUrlSearchParams({ locale }),
	});
}
