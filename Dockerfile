# syntax=docker/dockerfile:1

# using alpine base image to avoid `sharp` memory leaks.
# @see https://sharp.pixelplumbing.com/install#linux-memory-allocator

# base
FROM node:26-alpine AS base

# node.js >= 25 no longer ships corepack, so install the standalone pnpm binary
# matching the `packageManager` version from `package.json`.
ARG TARGETARCH
COPY package.json /tmp/package.json
RUN PNPM_VERSION="$(node -p 'require("/tmp/package.json").packageManager.split("@")[1].split("+")[0]')" \
	&& case "${TARGETARCH:-amd64}" in \
		amd64) PNPM_ARCH=x64 ;; \
		arm64) PNPM_ARCH=arm64 ;; \
		*) echo "Unsupported architecture: ${TARGETARCH}" >&2 && exit 1 ;; \
	esac \
	&& mkdir -p /usr/local/lib/pnpm \
	&& wget -qO- "https://github.com/pnpm/pnpm/releases/download/v${PNPM_VERSION}/pnpm-linux-${PNPM_ARCH}-musl.tar.gz" \
		| tar -xz -C /usr/local/lib/pnpm \
	&& ln -s /usr/local/lib/pnpm/pnpm /usr/local/bin/pnpm \
	&& rm /tmp/package.json \
	&& pnpm --version

RUN mkdir /app && chown -R node:node /app
WORKDIR /app

USER node

COPY --chown=node:node package.json pnpm-lock.yaml pnpm-workspace.yaml ./

RUN pnpm fetch --prod
RUN pnpm install --frozen-lockfile --ignore-scripts --offline --prod

# build
FROM base AS build

# Dependency lifecycle scripts must skip Git hooks in this Git-free build stage.
ENV CI=true

RUN pnpm fetch --dev

COPY --chown=node:node ./ ./

# astro assets cache
COPY --chown=node:node ./node_modules/.astro ./node_modules/.astro

ARG PUBLIC_APP_BASE_PATH
ARG PUBLIC_APP_BASE_URL
ARG PUBLIC_BOTS
ARG PUBLIC_GOOGLE_SITE_VERIFICATION
ARG PUBLIC_IMPRINT_SERVICE_BASE_URL
ARG PUBLIC_KEYSTATIC_GITHUB_APP_SLUG
ARG PUBLIC_KEYSTATIC_GITHUB_REPO_NAME
ARG PUBLIC_KEYSTATIC_GITHUB_REPO_OWNER
ARG PUBLIC_KEYSTATIC_MODE
ARG PUBLIC_MATOMO_BASE_URL
ARG PUBLIC_MATOMO_ID
ARG PUBLIC_REDMINE_ID
ARG PUBLIC_TYPESENSE_HOST
ARG PUBLIC_TYPESENSE_PORT
ARG PUBLIC_TYPESENSE_PROTOCOL
ARG PUBLIC_TYPESENSE_COLLECTION_NAME
ARG PUBLIC_TYPESENSE_SEARCH_API_KEY

# disable validation for runtime environment variables
ENV ENV_VALIDATION=public

RUN pnpm install --frozen-lockfile --offline

ENV NODE_ENV=production

RUN --mount=type=secret,id=KEYSTATIC_GITHUB_CLIENT_ID,uid=1000 \
		--mount=type=secret,id=KEYSTATIC_GITHUB_CLIENT_SECRET,uid=1000 \
		--mount=type=secret,id=KEYSTATIC_SECRET,uid=1000 \
			KEYSTATIC_GITHUB_CLIENT_ID=$(cat /run/secrets/KEYSTATIC_GITHUB_CLIENT_ID) \
			KEYSTATIC_GITHUB_CLIENT_SECRET=$(cat /run/secrets/KEYSTATIC_GITHUB_CLIENT_SECRET) \
			KEYSTATIC_SECRET=$(cat /run/secrets/KEYSTATIC_SECRET) \
		pnpm run build

# serve
FROM node:26-alpine AS serve

RUN mkdir /app && chown -R node:node /app
WORKDIR /app

USER node

COPY --from=base --chown=node:node /app/node_modules ./node_modules
# note: `dist` must keep its path from the build stage, because the astro image
# endpoint reads source images from the build-time absolute path to `dist/client`.
COPY --from=build --chown=node:node /app/dist ./dist

# these content pages need to be available at runtime, because they are not prerendered.
COPY --chown=node:node ./content/pages/lexikon ./content/pages/lexikon
COPY --chown=node:node ./content/pages/kontakt.mdx ./content/pages/kontakt.mdx
COPY --chown=node:node ./content/pages/werkverzeichnis/wab.mdx ./content/pages/werkverzeichnis/wab.mdx

# these html snippets need to be available at runtime. TODO: different folder structure
COPY --chown=node:node ./src/edition/facs ./src/edition/facs
COPY --chown=node:node ./src/edition/provenance.json ./src/edition/provenance.json

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

EXPOSE 3000

CMD [ "node", "./dist/server/entry.mjs" ]
