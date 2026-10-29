import type { APIContext, MiddlewareNext } from "astro";

import { resolveLegacyUrl } from "@/lib/legacy-urls";

export function onRequest(context: APIContext, next: MiddlewareNext) {
	const { url, redirect } = context;

	const location = resolveLegacyUrl(url);
	if (location != null) {
		return redirect(location, 301);
	}

	return next();
}
