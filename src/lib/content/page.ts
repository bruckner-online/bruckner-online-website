import type { Locale } from "@/config/i18n.config";
import { processMdx } from "@/lib/content/mdx";
import { reader } from "@/lib/content/reader";

/** Read a CMS page and compile its body for rendering, retaining its metadata. */
export async function readPage(slug: string, locale: Locale) {
	const page = await reader().collections.pages.readOrThrow(slug);
	const { default: Content } = await processMdx(await page.content(), locale);
	return { page, Content };
}
