#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC_DIR="$ROOT_DIR/backend/boilerplate-springboot-grpc"
DST_DIR="$ROOT_DIR/backend/orbit-platform"

if [[ ! -d "$SRC_DIR" ]]; then
  echo "[bootstrap] source not found: $SRC_DIR" >&2
  exit 1
fi

mkdir -p "$DST_DIR"
rsync -a --delete --exclude '.git' "$SRC_DIR/" "$DST_DIR/"

mkdir -p "$DST_DIR/services/platform-event-kit/src/main/java/com/orbit/eventkit"
mkdir -p "$DST_DIR/docs/adr"
mkdir -p "$DST_DIR/contracts/events"
mkdir -p "$DST_DIR/deploy"

echo "[bootstrap] synced boilerplate -> orbit-platform"
