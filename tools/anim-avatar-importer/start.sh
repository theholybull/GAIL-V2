#!/usr/bin/env bash
# Gail Animation Importer — Launcher

set -e

TOOL_DIR="$(cd "$(dirname "$0")" && pwd)"
TOOLS_ROOT="$(dirname "$TOOL_DIR")"
REPO_ROOT="$(dirname "$TOOLS_ROOT")"
REPO_LIB_DIR="$REPO_ROOT/data/animation-library/converted_animations_20260401"
LEGACY_LIB_DIR="$(dirname "$REPO_ROOT")/converted_animations_20260401"
LIB_DIR="$REPO_LIB_DIR"
if [ ! -d "$LIB_DIR" ]; then
  LIB_DIR="$LEGACY_LIB_DIR"
fi
CATALOG="$REPO_ROOT/data/animation-importer/catalog.json"

echo
echo "  Gail Animation Importer — Port 8888"
echo

if ! command -v node &>/dev/null; then
  echo "  ERROR: Node.js not found. Install from https://nodejs.org/"
  exit 1
fi

echo "  Node.js: $(node --version)"

if [ -d "$LIB_DIR" ]; then
  count=$(find "$LIB_DIR" -name "*.glb" | wc -l | tr -d ' ')
  echo "  Animation library: $count clips"
else
  echo "  WARNING: Animation library not found at $LIB_DIR"
fi

if [ -f "$CATALOG" ]; then
  entries=$(python3 -c "import json,sys; d=json.load(open('$CATALOG')); print(len(d))" 2>/dev/null || echo "?")
  echo "  Catalog: $entries entries cached"
else
  echo "  Catalog: not built yet"
fi

echo
echo "  Starting server..."
echo "  Open: http://127.0.0.1:8888/"
echo "  Press Ctrl+C to stop"
echo

cd "$TOOL_DIR"
exec node server.js
