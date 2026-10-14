#!/usr/bin/env sh
set -eu
cd "$(dirname "$0")"
if ! command -v node >/dev/null 2>&1; then echo 'Node.js 20+ is required.'; exit 1; fi
npm install
npm run dev -- --host 127.0.0.1
