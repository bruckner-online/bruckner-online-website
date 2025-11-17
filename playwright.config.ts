import { join } from "node:path";

import { defineConfig, devices } from "@playwright/test";
import { config as dotenv } from "dotenv";
import { expand } from "dotenv-expand";
import isCI from "is-in-ci";

for (const envFilePath of [".env.test.local", ".env.local", ".env.test", ".env"]) {
	expand(dotenv({ path: join(process.cwd(), envFilePath) }));
}

const port = 3000;
const baseUrl = `http://localhost:${String(port)}`;

export default defineConfig({
	testDir: "./e2e",
	snapshotDir: "./e2e/snapshots",
	fullyParallel: true,
	forbidOnly: isCI,
	retries: isCI ? 2 : 0,
	maxFailures: 10,
	workers: isCI ? 1 : undefined,
	reporter: isCI ? "github" : "html",
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
		command: "pnpm run start",
		url: baseUrl,
		reuseExistingServer: !isCI,
	},
});
