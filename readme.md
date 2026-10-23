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
