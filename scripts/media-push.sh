#!/usr/bin/env bash
# Uploads the licensed media (public/assets/sb/, never in git) to the R2
# bucket served at VITE_MEDIA_BASE. Auth: `npx wrangler login` once (OAuth,
# no keys on disk), or CLOUDFLARE_API_TOKEN + CLOUDFLARE_ACCOUNT_ID in the env.
# Usage: pnpm media:push [bucket]   (default: $R2_BUCKET or feliperl-media)
set -euo pipefail
cd "$(dirname "$0")/.."
[ -f .env.local ] && set -a && . ./.env.local && set +a
BUCKET="${1:-${R2_BUCKET:-feliperl-media}}"
DIR=public/assets/sb
type_of() {
  case "$1" in
    *.mp4) echo video/mp4 ;; *.webm) echo video/webm ;; *.webp) echo image/webp ;;
    *.mp3) echo audio/mpeg ;; *) echo application/octet-stream ;;
  esac
}
n=0
for f in "$DIR"/*; do
  [ -f "$f" ] || continue
  name=$(basename "$f")
  echo "→ $name"
  npx --yes wrangler r2 object put "$BUCKET/$name" --file "$f" --remote \
    --content-type "$(type_of "$name")" \
    --cache-control "public, max-age=31536000, immutable" >/dev/null
  n=$((n + 1))
done
echo "$n arquivos em $BUCKET"
