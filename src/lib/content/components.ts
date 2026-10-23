import type { MDXComponents } from "mdx/types";

import AudioPlayer from "@/components/content/audio-player.astro";
import Download from "@/components/content/download.astro";
import Embed from "@/components/content/embed.astro";
import Figure from "@/components/content/figure.astro";
import FootnoteContent from "@/components/content/footnote-content.astro";
import FootnoteReference from "@/components/content/footnote-reference.astro";
import FootnotesSection from "@/components/content/footnote-section.astro";
import IconLink from "@/components/content/icon-link.astro";
import Img from "@/components/content/img.astro";
import Organisation from "@/components/content/organisation.astro";
import TranskriptionsTool from "@/components/content/transkriptions-tool.astro";
import Video from "@/components/content/video.astro";

export function useMDXComponents(): MDXComponents {
	return {
		AudioPlayer,
		Download,
		Embed,
		Figure,
		FootnoteContent,
		FootnoteReference,
		FootnotesSection,
		IconLink,
		img: Img as any,
		Organisation,
		TranskriptionsTool,
		Video,
	};
}
