import mdx from "@astrojs/mdx";
import node from "@astrojs/node";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import solidJs from "@astrojs/solid-js";
import keystatic from "@keystatic/astro";
import tailwindcss from "@tailwindcss/vite";
import icon from "astro-icon";
import { defineConfig, memoryCache } from "astro/config";
import { loadEnv } from "vite";

const env = loadEnv(import.meta.env.MODE, process.cwd(), "");

export default defineConfig({
	// Only routes that explicitly set cache options are stored. Each server
	// process keeps its own bounded cache, cleared on restart/deployment.
	cache: { provider: memoryCache({ max: 500 }) },
	vite: { plugins: [tailwindcss()] },
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
			include: [/\/(content|keystatic)\/.*\.[jt]sx?$/],
		}),
		solidJs({
			exclude: ["**/content/**", "**/keystatic/**"],
		}),
		sitemap(),
	],
	redirects: {
		"/admin": {
			destination: "/keystatic",
			status: 307,
		},
		"/ablo": {
			destination: "/lexikon",
			status: 307,
		},
		/** The navigation briefly linked here after a since-reverted page rename. */
		"/werkverzeichnis/konkordanz": {
			destination: "/werkverzeichnis/wab-konkordanz",
			status: 301,
		},
	},
	server: {
		port: 3000,
	},
	site: env.PUBLIC_APP_BASE_URL,
});
