# bruckner online website

website for the "bruckner online" project. deployed at <https://www.bruckner-online.at>.

Generate the Kopisten edition data locally with Docker running:

```sh
pnpm edition:build
```

This builds a cached Docker image containing Java, Ant, and Saxon, downloads the latest Kopisten XML
data, and generates `src/edition/` as your current user. It replaces `src/data/editions/` and
`src/data/meta/`. These data directories and the generated edition are gitignored. No devcontainer
or host Java installation is required.

Run `pnpm lint:check` to check code with Oxlint and styles with Stylelint, or `pnpm lint:fix` to
apply fixes. Oxlint configuration lives in `.oxlintrc.json`; the Oxc VS Code extension provides
editor integration. Oxlint checks JavaScript and TypeScript, including scripts in Astro files, but
does not lint Astro templates. The former ESLint Astro, Solid, and Playwright plugin checks and
React prop sorting are not included.

Oxlint also runs type-aware checks via `oxlint-tsgolint`, including unhandled and misused promises.
Keep `pnpm types:check` for Astro-specific type checking.

Lefthook runs these tools on staged files before each commit and stages their fixes. Hook
configuration lives in `.lefthook.json`. Hooks are installed during project setup; run `pnpm setup`
to reinstall them.

Run `pnpm audit:unused` for a manual Knip audit of unused files, exports, and dependencies.
`knip.json` includes dynamically loaded MDX content and the Playwright setup entry point. The Lucide
icon package is excluded from unused dependency reports because Astro Icon loads it by name from the
integration configuration. Knip is not part of CI or commit hooks while its existing findings are
reviewed; it exits with a nonzero status when it finds unused code.

Install the Chromium browser and operating system dependencies with `pnpm test:e2e:install`. CI runs
the Chromium tests with both GitHub annotations and an HTML report uploaded as an artifact, without
caching browser binaries.
