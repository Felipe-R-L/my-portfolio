#!/usr/bin/env bash
# Uploads the licensed media (public/assets/sb/, never in git) to the R2
# bucket served at VITE_MEDIA_BASE, through R2's S3 interface with rclone.
# Credentials in .env.local (never in git): R2_ACCOUNT_ID, R2_ACCESS_KEY_ID,
# R2_SECRET_ACCESS_KEY, R2_BUCKET. With a Cloudflare account API token, the
# key id is the token's id and the secret is the SHA-256 of its value.
# Usage: pnpm media:push
set -euo pipefail
cd "$(dirname "$0")/.."
set -a; . ./.env.local; set +a
export RCLONE_CONFIG_R2_TYPE=s3 RCLONE_CONFIG_R2_PROVIDER=Cloudflare \
  RCLONE_CONFIG_R2_ACCESS_KEY_ID="$R2_ACCESS_KEY_ID" \
  RCLONE_CONFIG_R2_SECRET_ACCESS_KEY="$R2_SECRET_ACCESS_KEY" \
  RCLONE_CONFIG_R2_ENDPOINT="https://$R2_ACCOUNT_ID.r2.cloudflarestorage.com" \
  RCLONE_CONFIG_R2_NO_CHECK_BUCKET=true
# the files never change under a name (a new cut gets a new name): cached for a year
rclone copy public/assets/sb "r2:${R2_BUCKET:-my-portfolio}" \
  --header-upload "Cache-Control: public, max-age=31536000, immutable" \
  --progress --stats-one-line
