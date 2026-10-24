#!/usr/bin/env bash
set -euo pipefail

edition_download=$(mktemp -d)
trap 'rm -rf "$edition_download"' EXIT

echo "Fetching Kopisten edition data..."
curl -fL --retry 3 \
  https://github.com/acdh-oeaw/bruckner-kopisten-data/archive/refs/heads/main.tar.gz \
  -o "$edition_download/data.tar.gz"
tar -xzf "$edition_download/data.tar.gz" -C "$edition_download"

# Only replace local data after the download and extraction succeed.
rm -rf src/data/editions src/data/meta
mkdir -p src/data/editions src/data/meta saxon
cp "$edition_download/bruckner-kopisten-data-main/data/editions/"*.xml src/data/editions/
cp "$edition_download/bruckner-kopisten-data-main/data/meta/"*.xml src/data/meta/
cp /opt/saxon/saxon9he.jar saxon/saxon9he.jar

ant -f src/scripts/ant/build.xml
