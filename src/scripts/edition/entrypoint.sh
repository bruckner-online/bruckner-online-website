#!/usr/bin/env bash
set -euo pipefail

# Lock across download, generation, validation and promotion, including direct runs.
exec 9>/workspace/.edition-build.lock
flock -n 9 || { echo 'Another edition build is running.' >&2; exit 1; }
export LC_ALL=C TZ=UTC
python3 src/scripts/edition/generate.py
