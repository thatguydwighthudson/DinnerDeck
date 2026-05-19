#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if grep -rnE 'motion\.(div|span|button|p|a|h[1-6])\b' src --include='*.tsx' 2>/dev/null; then
  echo "error: invalid JSX tag 'motion.*' found (use plain HTML elements)" >&2
  exit 1
fi

echo "JSX tag check passed"
