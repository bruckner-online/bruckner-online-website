import mdx from "@astrojs/mdx";
import node from "@astrojs/node";
import react from "@astrojs/react";
import solidJs from "@astrojs/solid-js";
import sitemap from "@astrojs/sitemap";
import keystatic from "@keystatic/astro";
import { defineConfig } from "astro/config";
import icon from "astro-icon";
import { loadEnv } from "vite";

const env = loadEnv(import.meta.env.MODE, process.cwd(), "");

export default defineConfig({
	adapter: node({
		mode: "standalone",
	}),
	base: env.PUBLIC_APP_BASE_PATH,
	integrations: [
		icon({
			/** @see https://www.astroicon.dev/reference/configuration/#include */
			include: {
				lucide: [
					"book",
					"camera",
					"chevron-down",
					"chevron-left",
					"chevron-right",
					"circle-pause",
					"circle-play",
					"database",
					"ellipsis",
					"menu",
					"quote",
					"search",
					"square-arrow-left",
					"x",
				],
			},
			svgoOptions: {
				multipass: true,
				plugins: [
					{
						name: "preset-default",
						params: {
							overrides: {
								removeViewBox: false,
							},
						},
					},
				],
			},
		}),
		keystatic(),
		mdx(),
		react({
			include: ["**/content/**", "**/keystatic/**"],
		}),
		solidJs({
			exclude: ["**/content/**", "**/keystatic/**"],
		}),
		sitemap(),
	],
	prefetch: {
		defaultStrategy: "hover",
		prefetchAll: true,
	},
	redirects: {
		"/admin": {
			destination: "/keystatic",
			status: 307,
		},
		"/ablo": {
			destination: "/lexikon",
			status: 307,
		},
	},
	server: {
		port: 3000,
	},
	site: env.PUBLIC_APP_BASE_URL,
});
