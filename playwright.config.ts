import { existsSync } from "node:fs";
import { join } from "node:path";

import { defineConfig, devices } from "@playwright/test";
import isCI from "is-in-ci";

/** Earlier files take precedence, and variables already set in the environment are not overridden. */
for (const envFilePath of [".env.test.local", ".env.local", ".env.test", ".env"]) {
	const filePath = join(process.cwd(), envFilePath);
	if (existsSync(filePath)) {
		process.loadEnvFile(filePath);
	}
}

const port = Number(process.env.PLAYWRIGHT_PORT ?? 3000);
const baseUrl = `http://127.0.0.1:${String(port)}`;

export default defineConfig({
	testDir: "./e2e",
	snapshotDir: "./e2e/snapshots",
	fullyParallel: true,
	forbidOnly: isCI,
	retries: isCI ? 2 : 0,
	maxFailures: 10,
	workers: isCI ? 1 : undefined,
	reporter: isCI ? [["github"], ["html", { open: "never" }]] : "html",
	use: {
		baseURL: baseUrl,
		trace: "on-first-retry",
	},
	projects: [
		{
			name: "setup",
			testMatch: "global.setup.ts",
		},
		{
			name: "chromium",
			use: { ...devices["Desktop Chrome"] },
			dependencies: ["setup"],
		},
	],
	webServer: {
		command: "node --import ./e2e/lib/lexicon-api-mock.mjs dist/server/entry.mjs",
		env: { PORT: String(port), HOST: "127.0.0.1" },
		url: baseUrl,
		reuseExistingServer: false,
	},
});
