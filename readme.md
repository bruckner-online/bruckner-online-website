# Bruckner online

Website for the Bruckner online project, deployed at <https://www.bruckner-online.at>.

## Research services and data sources

The website brings together several research services and datasets:

| Section                        | Service or data source                                                                     | Integration                                                                                                                                     |
| ------------------------------ | ------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Lexikon                        | [Bruckner-Lexikon API](https://api-brucknerlex.acdh.oeaw.ac.at)                            | Fetches lexicon articles and indexes from the external API.                                                                                     |
| Werkverzeichnis                | [Werkverzeichnis Anton Bruckner (WAB)](https://apps-mufo.oeaw.ac.at/dcm/wab/navigation.xq) | Embeds the external catalogue, with links to individual work records.                                                                           |
| Manuscripts and first editions | [IIIF Presentation service](https://iiifpresentation.acdh.oeaw.ac.at)                      | Displays digitised sources in Mirador using manifests under `bruckner` (manuscripts) and `bruckner/drucke` (first editions).                    |
| Kopisten                       | [bruckner-kopisten-data](https://github.com/acdh-oeaw/bruckner-kopisten-data)              | Downloads XML data and generates the edition locally using Java, Ant, and Saxon in Docker. See [Kopisten edition data](#kopisten-edition-data). |
| Bibliography                   | Local JSON database export and a configured Typesense instance                             | Imports the export into Typesense for frontend search. See [Bibliography search](#bibliography-search).                                         |

## Getting started

Requirements: Node.js 24, pnpm (the version specified in `package.json`), and Docker for generating
Kopisten edition data.

```sh
pnpm install
cp .env.local.example .env.local
```

Configure `.env.local` with the required email and Typesense settings. The example includes defaults
for the local application URL and imprint service.

Generate the edition data, then start the development server:

```sh
pnpm edition:build
pnpm dev
```

The website runs at <http://localhost:3000>.

## Kopisten edition data

With Docker running, generate or refresh the edition:

```sh
pnpm edition:build
```

This downloads the latest XML data from
[bruckner-kopisten-data](https://github.com/acdh-oeaw/bruckner-kopisten-data) and generates
`src/edition/`. It replaces `src/data/editions/` and `src/data/meta/`. All three generated
directories are gitignored. Java, Ant, and Saxon run inside Docker; no host installation is
required.

CI uses the same Docker builder for validation and deployment builds.

## Bibliography search

The bibliography is indexed in Typesense from `src/data/bibliography_db_export_202506121637.json`.
Configure these variables in `.env.local`:

- `PUBLIC_TYPESENSE_HOST`
- `PUBLIC_TYPESENSE_PORT`
- `PUBLIC_TYPESENSE_PROTOCOL` (`http` or `https`)
- `PUBLIC_TYPESENSE_COLLECTION_NAME` (the search alias)
- `PUBLIC_TYPESENSE_SEARCH_API_KEY` (for frontend searches)
- `TYPESENSE_ADMIN_API_KEY` (for indexing)

Populate or refresh the index:

```sh
pnpm typesense:populate
```

The importer validates the configuration and source data, creates a unique collection, and switches
the search alias only after every document imports successfully. Existing collections are retained
for recovery.

### Migrating an existing collection

If `PUBLIC_TYPESENSE_COLLECTION_NAME` currently names a physical collection, choose a new alias
name, populate it, then rebuild and deploy the frontend with that name. Ensure the search key
permits searches through the new alias. The old collection remains available throughout migration.
Subsequent imports use the same alias name.

Remove obsolete collections manually after confirming that no alias or frontend uses them. If
publishing fails with a network error, inspect the alias before retrying: the switch may have
succeeded on the server.

## Production build

Generate the edition data and configure the environment before building:

```sh
pnpm build
pnpm start
```

## Validation

Run formatting, lint, and type checks:

```sh
pnpm format:check
pnpm lint:check
pnpm types:check
```

Lexikon integration tests use fixture responses and do not require external services:

```sh
pnpm test:unit
```

End-to-end tests run against the production build. Install the browser dependencies once, then build
and run the tests:

```sh
pnpm test:e2e:install
pnpm build
pnpm test:e2e
```
