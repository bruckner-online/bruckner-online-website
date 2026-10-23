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
does not lint Astro templates. React prop sorting is not included.

Oxlint runs explicit rules in `.oxlintrc.json`, including strict type-aware checks via
`oxlint-tsgolint` and native React rules. Solid, Playwright, RegExp, and Tailwind checks run through
Oxlint's JavaScript plugin support. Keep `pnpm types:check` for Astro-specific type checking. Oxfmt
handles import ordering. Unused lint suppressions are reported as errors.

Tailwind v4 uses the Vite plugin and CSS configuration in `src/styles/index.css`. The theme
preserves the former preset's design tokens and document defaults. Explicit sources cover CMS
content and gitignored `src/edition/` HTML; inline sources preserve the former safelist. Tailwind
linting covers JavaScript/TypeScript strings and JSX; Oxlint does not analyze Astro templates or
generated HTML. The `tables-striped` style hook and third-party widget class prefixes are exempt
from unknown-class reports. The production browser targets follow Tailwind v4's minimum supported
versions.

Lefthook runs these tools on staged files before each commit and stages their fixes. Hook
configuration lives in `.lefthook.json`. Hooks are installed during project setup; run `pnpm setup`
to reinstall them.

Install the Chromium browser and operating system dependencies with `pnpm test:e2e:install`. CI runs
the Chromium tests with both GitHub annotations and an HTML report uploaded as an artifact, without
caching browser binaries.
