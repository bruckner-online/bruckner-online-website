import { join } from "node:path";

import type { CompileOptions } from "@mdx-js/mdx";
import withAssets from "rehype-mdx-import-media";
import withHeadingIds from "rehype-slug";
import withFrontmatter from "remark-frontmatter";
import withGfm from "remark-gfm";
import withMdxFrontmatter from "remark-mdx-frontmatter";
import withTypographicQuotes from "remark-smartypants";
import type { Options as TypographicOptions } from "retext-smartypants";

import type { Locale } from "@/config/i18n.config";
import { withMdxFootnotes } from "@/lib/content/footnotes";
import { createI18n } from "@/lib/i18n";

const cache = new Map<Locale, CompileOptions>();

const typography: Record<Locale, TypographicOptions> = {
	de: {
		openingQuotes: { double: "„", single: "‚" },
		closingQuotes: { double: "“", single: "‘" },
	},
};

export async function createConfig(locale: Locale) {
	if (cache.has(locale)) return cache.get(locale)!;

	const { t } = await createI18n(locale);

	const config: CompileOptions = {
		baseUrl: join(process.cwd(), "public"),
		remarkPlugins: [
			withFrontmatter,
			withMdxFrontmatter,
			withGfm,
			[withTypographicQuotes, typography[locale]],
		],
		remarkRehypeOptions: {
			footnoteBackLabel(referenceIndex, rereferenceIndex) {
				return t("Mdx.FootnoteBackLabel", {
					reference:
						String(referenceIndex + 1) +
						(rereferenceIndex > 1 ? `-${String(rereferenceIndex)}` : ""),
				});
			},
			footnoteLabel: t("Mdx.Footnotes"),
		},
		rehypePlugins: [withMdxFootnotes, withHeadingIds, withAssets],
	};

	cache.set(locale, config);

	return config;
}
