import baseConfig from "@acdh-oeaw/eslint-config";
import astroConfig from "@acdh-oeaw/eslint-config-astro";
import playwrightConfig from "@acdh-oeaw/eslint-config-playwright";
import reactConfig from "@acdh-oeaw/eslint-config-react";
import solidJsConfig from "@acdh-oeaw/eslint-config-solid";
// import tailwindcssConfig from "@acdh-oeaw/eslint-config-tailwindcss";
import { defineConfig } from "eslint/config";
import gitignore from "eslint-config-flat-gitignore";

const reactFiles = [
	"keystatic.config.@(ts|tsx)",
	"**/content/**/*.@(ts|tsx)",
	"**/keystatic/**/*.@(ts|tsx)",
];

const solidJsFiles = ["**/components/**/*.@(ts|tsx)", "**/ui/**/*.@(ts|tsx)"];

const config = defineConfig(
	gitignore({ strict: false }),
	baseConfig,
	{
		ignores: [...reactFiles, ...solidJsFiles],
		extends: [astroConfig],
	},
	{
		files: reactFiles,
		extends: [reactConfig],
	},
	{
		files: solidJsFiles,
		ignores: reactFiles,
		extends: [solidJsConfig],
	},
	// tailwindcssConfig,
	playwrightConfig,
	{
		rules: {
			"arrow-body-style": ["error", "always"],
		},
	},
	{
		files: reactFiles,
		rules: {
			"react/jsx-sort-props": ["error", { reservedFirst: true }],
		},
	},
);

export default config;
