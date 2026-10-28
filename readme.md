# Bruckner online

Website for the Bruckner online project, deployed at <https://www.bruckner-online.at>.

## Research services and data sources

The website brings together several research services and datasets:

| Section                          | Service or data source                                                                     | Integration                                                                                                                                                                                                                                                                                       |
| -------------------------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Lexikon                          | [Bruckner-Lexikon API](https://api-brucknerlex.acdh.oeaw.ac.at)                            | Fetches lexicon articles and indexes at request time. Successful responses are cached in memory per server process: articles for 1 hour, indexes and author pages for 10 minutes.                                                                                                                 |
| Werkverzeichnis                  | [Werkverzeichnis Anton Bruckner (WAB)](https://apps-mufo.oeaw.ac.at/dcm/wab/navigation.xq) | Embeds the external catalogue. `/werkverzeichnis/wab?WAB=wab-001` loads `document.xq?doc=wab-001.xml`; without `WAB` it loads the catalogue navigation.                                                                                                                                           |
| Chronologie                      | [Anton Bruckner Chronologie Datenbank](https://abcd.acdh-dev.oeaw.ac.at)                   | Embedded in the `forschung/chronologie-datenbank` content page.                                                                                                                                                                                                                                   |
| Manuscripts, first editions, AGA | [IIIF Presentation service](https://iiifpresentation.acdh.oeaw.ac.at)                      | Displays digitised sources in Mirador. Manuscripts (`/handschriften`) use manifests under `bruckner/<siglum>`. First editions (`/erstdrucke?wabId=`) and the Alte Gesamtausgabe (`/aga?aga=`) use `bruckner/drucke/<id>`, with identifiers such as `WAB001`, `WAB083_1`, `WAB084,1`, and `AGA15`. |
| Kopisten                         | [bruckner-kopisten-data](https://github.com/acdh-oeaw/bruckner-kopisten-data)              | Downloads XML data and generates the edition locally using Java, Ant, and Saxon in Docker. See [Kopisten edition data](#kopisten-edition-data).                                                                                                                                                   |
| Bibliography                     | Local JSON database export and a configured Typesense instance                             | Imports the export into Typesense for frontend search. See [Bibliography search](#bibliography-search).                                                                                                                                                                                           |

### Supporting services

| Service                                                 | Used for                        | Configuration                                          | When                                                                                     |
| ------------------------------------------------------- | ------------------------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| [ACDH imprint service](https://imprint.acdh.oeaw.ac.at) | Imprint page text               | `PUBLIC_IMPRINT_SERVICE_BASE_URL`, `PUBLIC_REDMINE_ID` | Build time: `/impressum` is prerendered, so the build needs the service to be reachable. |
| Matomo                                                  | Analytics                       | `PUBLIC_MATOMO_BASE_URL`, `PUBLIC_MATOMO_ID`           | In the browser                                                                           |
| SMTP server                                             | Contact form delivery           | `EMAIL_SMTP_*`, `EMAIL_CONTACT_ADDRESS`                | Request time                                                                             |
| GitHub (Keystatic)                                      | Content editing at `/keystatic` | `PUBLIC_KEYSTATIC_*`, `KEYSTATIC_*`                    | Editing only                                                                             |

### When a service is unavailable

| Service       | What visitors see                                                                                                                                        |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Lexikon API   | An error message with a retry link that keeps the current filters. Failed responses are not cached.                                                      |
| Typesense     | A "search unavailable" message with a retry button. An outage is never shown as zero results.                                                            |
| IIIF          | A "digitised sources unavailable" message with a retry button when the first manifest cannot load. After startup, Mirador handles image failures itself. |
| WAB catalogue | The catalogue's own error inside the embed, with a direct link to the catalogue above it.                                                                |
| Chronologie   | The database's own error inside the embed. There is no fallback link.                                                                                    |

### Embedding external pages

Content pages embed external tools with `<Embed href="https://…" caption="…" />` in MDX. Set `href`,
or the embed renders an empty frame. The external host must allow being framed: no
`X-Frame-Options: DENY` or `SAMEORIGIN`, and no `frame-ancestors` policy that excludes this site.

### URLs of the previous site

URLs of the previous site are still linked from elsewhere. Redirect them permanently (301) instead
of recreating pages:

- URLs matched by pattern or query parameter (`/ABLO_<id>`, `/wab-<nnn>`, `/miradorAGA.php?AGA=`,
  `/miradorDrucke.php?WAB=`) are redirected in `src/middleware.ts`.
- Fixed paths, including pages renamed or removed in Keystatic, are redirected in `redirects` in
  `astro.config.ts`.

Content links to current, relative URLs. `e2e/tests/app/legacy-urls.test.ts` covers the redirects.
`tests/navigation.test.ts` checks that navigation entries reference existing pages, since renaming a
page in Keystatic does not update them.

## Source layout

Astro routes live in `src/pages/`. Research implementations are grouped in `src/features/`:

| Feature             | Contents                                                                                      |
| ------------------- | --------------------------------------------------------------------------------------------- |
| `lexicon`           | API client, indexes, search form, citations, navigation, and layout.                          |
| `kopisten`          | Copyist selection, edition tables and maps, language toggle, navigation, layouts, and footer. |
| `bibliography`      | Search UI, Typesense schema, indexing script, and database export.                            |
| `digitised-sources` | Mirador viewer and the signature-to-WAB mapping used by manuscripts, first editions, and AGA. |
| `contact`           | Form validation, submission outcomes, and SMTP delivery.                                      |

Features use the shared website elements in `src/components/`, layouts in `src/layouts/`, and
utilities in `src/lib/`. Import a feature implementation directly from its directory; keep shared UI
and content rendering independent of individual research features. The WAB catalogue and chronology
currently use shared elements directly in their routes.

Kopisten generation remains in `src/scripts/edition/`, `src/scripts/ant/`, and `src/scripts/xslt/`.
Its generated files retain their existing locations in `src/edition/`, `src/data/editions/`, and
`src/data/meta/`.

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

The source revision, archive SHA-256, and artifact date are pinned in
`src/scripts/edition/source.json`. To update the source, resolve a full commit SHA, download its
archive, and update the checksum and date together. No mutable branch is used during generation.
Java, Ant, Saxon, and Python run inside Docker; no host installation is required.

Generation runs in a temporary workspace on the same filesystem. It validates XML, the nonempty
index and known ID collisions, every detail and facsimile snippet, all metadata pages and tables,
and the filename-to-ID mappings before replacing `src/edition/`, `src/data/editions/`, and
`src/data/meta/`. Existing output survives download, transform, or validation failures. Promotion
uses directory renames and rolls back on errors; readers should not run concurrently with promotion.
A build lock prevents concurrent generators. Fresh directories remove stale generated files.

The website contract stays unchanged: index fields are `id`, `filename`, `title`, and
`copyist_name`; detail HTML uses filenames, while runtime facsimile HTML uses IDs.
`src/edition/provenance.json` records the pinned source, input and generator checksums, tool
checksums, and all artifact checksums. The citation date is the pinned artifact date so regeneration
does not change with the wall clock. The production image retains provenance alongside its runtime
facsimiles.

Run failure-path checks with
`PYTHONDONTWRITEBYTECODE=1 python3 -m unittest discover -s src/scripts/edition`. To check
reproducibility, generate twice and compare `src/edition/provenance.json` (including all artifact
hashes). Generated directories remain gitignored.

The pinned upstream data shares three IDs across eleven records. `knownDuplicateIds` lists these
collisions by filename; validation accepts exactly these groups and rejects new collisions. Existing
routes and facsimile filenames are preserved. Resolving the collisions requires a separate source
and URL migration.

CI uses the same Docker builder for validation and deployment builds.

## Bibliography search

The bibliography is indexed in Typesense from
`src/features/bibliography/data/bibliography_db_export_202506121637.json`. Configure these variables
in `.env.local`:

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

Unit tests use fixture responses and do not require external services:

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

Playwright starts a dedicated production server with a test-only Lexikon API adapter, so index tests
exercise server rendering without depending on the live API. The adapter is not loaded by normal
production startup. Index tests also run with JavaScript disabled. Tests for other external services
intercept their requests in the browser: Typesense and IIIF receive mocked responses, and the WAB
catalogue is blocked to exercise its fallback.

If port 3000 is already in use, select another port for the test server:

```sh
PLAYWRIGHT_PORT=19437 pnpm test:e2e
```
