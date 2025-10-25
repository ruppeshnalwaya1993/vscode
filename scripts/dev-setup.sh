#!/usr/bin/env bash

# -----------------------------------------------------------------------------------
# RisingBird / Code-OSS development helper
#
# Purpose
#   One-stop script to:
#     1) Ensure Node 22 via nvm (or verify current Node is 22.x)
#     2) Clean build artifacts (soft/full)
#     3) Install deps (skipping Playwright browser download by default)
#     4) Compile the source
#     5) Optionally launch the Electron dev app
#
# Usage
#   scripts/dev-setup.sh [--clean soft|full|nuclear] [--node 22.20.0]
#                        [--python /path/to/python3] [--skip-playwright true|false]
#                        [--compile-only] [--run]
#
# Examples
#   # Full clean, install, compile, run
#   scripts/dev-setup.sh --clean full --run
#
#   # Soft clean (outputs only), compile without launching
#   scripts/dev-setup.sh --clean soft --compile-only
#
#   # Use a specific Python for node-gyp
#   scripts/dev-setup.sh --python "$(which python3)" --run
#
# Notes
#   - If nvm is available, we switch to Node 22.20.0 (override with --node).
#   - If nvm is not available, your current Node must be 22.x (the build expects it).
#   - We default to PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 to avoid large downloads.
# -----------------------------------------------------------------------------------

set -euo pipefail

# Resolve repo root (works on macOS and Linux)
if [[ "${OSTYPE:-}" == darwin* ]]; then
	realpath() { [[ $1 = /* ]] && echo "$1" || echo "$PWD/${1#./}"; }
	ROOT_DIR=$(dirname "$(dirname "$(realpath "$0")")")
else
	ROOT_DIR=$(dirname "$(dirname "$(readlink -f "$0")")")
fi
cd "$ROOT_DIR"

NODE_VERSION="22.20.0"
CLEAN_MODE=""
PYTHON_BIN=""
SKIP_PLAYWRIGHT="true"
RUN_APP="false"
COMPILE_ONLY="false"

print_help() {
	sed -n '1,80p' "$0" | sed 's/^# \{0,1\}//'
}

while [[ $# -gt 0 ]]; do
	case "$1" in
		--clean)
			CLEAN_MODE="${2:-}"
			shift 2
			;;
		--node)
			NODE_VERSION="${2:-}"
			shift 2
			;;
		--python)
			PYTHON_BIN="${2:-}"
			shift 2
			;;
		--skip-playwright)
			SKIP_PLAYWRIGHT="${2:-}"
			shift 2
			;;
		--compile-only)
			COMPILE_ONLY="true"
			shift
			;;
		--run)
			RUN_APP="true"
			shift
			;;
		-h|--help)
			print_help
			exit 0
			;;
		*)
			echo "Unknown option: $1" >&2
			print_help
			exit 1
			;;
	esac
done

echo "[dev-setup] ROOT_DIR: $ROOT_DIR"

# 1) Node setup via nvm (if present)
# Try to auto-load nvm if installed but not on PATH
if [[ -z "${NVM_DIR:-}" && -d "$HOME/.nvm" ]]; then
	export NVM_DIR="$HOME/.nvm"
fi
if [[ -n "${NVM_DIR:-}" && -s "$NVM_DIR/nvm.sh" ]]; then
	# shellcheck source=/dev/null
	. "$NVM_DIR/nvm.sh"
fi

if command -v nvm >/dev/null 2>&1; then
	echo "[dev-setup] Using nvm to install/use Node $NODE_VERSION"
	nvm install "$NODE_VERSION" >/dev/null 2>&1 || true
	nvm use "$NODE_VERSION"
else
	echo "[dev-setup] nvm not found; proceeding with system Node $(node -v || echo 'N/A')"
	if ! node -v 2>/dev/null | grep -q "^v22\."; then
		echo "[dev-setup] Error: Node 22.x required. Install nvm (https://github.com/nvm-sh/nvm) or switch to Node $NODE_VERSION." >&2
		exit 1
	fi
fi

echo "[dev-setup] Node: $(node -v)  npm: $(npm -v)"

# 2) Cleaning
soft_clean() {
	echo "[dev-setup] Soft clean: removing build outputs"
	rm -rf out .build || true
	# Remove extension out folders safely across shells
	find extensions -mindepth 2 -maxdepth 2 -type d -name out -exec rm -rf {} + 2>/dev/null || true
}

full_clean() {
	soft_clean
	echo "[dev-setup] Full clean: removing node_modules"
	rm -rf node_modules build/node_modules || true
}

nuclear_clean() {
	echo "[dev-setup] Nuclear clean: removing all untracked files (git clean -xfd)"
	git clean -xfd
}

case "$CLEAN_MODE" in
	soft)
		soft_clean
		;;
	full)
		full_clean
		;;
	nuclear)
		nuclear_clean
		;;
	"")
		;;
	*)
		echo "[dev-setup] Unknown clean mode: $CLEAN_MODE (use soft|full|nuclear)" >&2
		exit 1
		;;
esac

# 3) Install dependencies (skip large Playwright downloads by default)
export PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD
if [[ "$SKIP_PLAYWRIGHT" == "true" ]]; then
	export PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
	echo "[dev-setup] PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1"
else
	unset PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD || true
fi

if [[ -n "$PYTHON_BIN" ]]; then
	echo "[dev-setup] Using PYTHON=$PYTHON_BIN for node-gyp"
	PYTHON="$PYTHON_BIN" npm ci
else
	npm ci
fi

# 4) Compile
echo "[dev-setup] Compiling sources"
npm run compile

# 5) Optionally run the Electron dev app
if [[ "$COMPILE_ONLY" == "true" ]]; then
	echo "[dev-setup] Compile-only requested; skipping launch"
	exit 0
fi

if [[ "$RUN_APP" == "true" ]]; then
	echo "[dev-setup] Launching Electron dev app"
	npm run electron
else
	echo "[dev-setup] Skipping launch (use --run to launch after compile)"
fi


