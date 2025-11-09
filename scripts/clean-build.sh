#!/usr/bin/env bash

# -----------------------------------------------------------------------------------
# Soft Clean + Compile (minimal)
#
# Purpose
#   Removes build outputs only (keeps node_modules) and compiles the source.
#
# Usage
#   scripts/clean-build.sh
# -----------------------------------------------------------------------------------

set -euo pipefail

# Resolve repo root
if [[ "${OSTYPE:-}" == darwin* ]]; then
	realpath() { [[ $1 = /* ]] && echo "$1" || echo "$PWD/${1#./}"; }
	ROOT_DIR=$(dirname "$(dirname "$(realpath "$0")")")
else
	ROOT_DIR=$(dirname "$(dirname "$(readlink -f "$0")")")
fi
cd "$ROOT_DIR"

echo "[clean-build] ROOT_DIR: $ROOT_DIR"

echo "[clean-build] Soft clean: removing build outputs"
rm -rf out .build || true
find extensions -mindepth 2 -maxdepth 2 -type d -name out -exec rm -rf {} + 2>/dev/null || true

echo "[clean-build] Compiling sources"
npm run compile

echo "[clean-build] Done. Launch with: npm run electron (or ./scripts/code.sh)"


