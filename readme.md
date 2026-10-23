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

Lefthook runs these tools on staged files before each commit and stages their fixes. Hook
configuration lives in `.lefthook.json`. Hooks are installed during project setup; run `pnpm setup`
to reinstall them.
