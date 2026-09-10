#!/bin/bash
set -e

echo "=== Installing dependencies ==="
npm install --no-audit --no-fund

echo "=== Creating .dev.vars from environment ==="
# Wrangler reads local secrets from .dev.vars (not container env vars).
# Bridge platform-delivered secrets into .dev.vars, with dev placeholders.
echo "ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY:-dev-placeholder}" > .dev.vars
echo "JWT_SECRET=${JWT_SECRET:-dev-jwt-secret}" >> .dev.vars

echo "=== Generating dev wrangler config (without remote AI binding) ==="
# The AI binding runs in "remote" mode and requires CLOUDFLARE_API_TOKEN.
# Strip it for local dev so wrangler dev can start without Cloudflare creds.
sed '/# Workers AI/,/binding = "AI"/d' wrangler.toml > wrangler.dev.toml

echo "=== Applying D1 migrations (local) ==="
npx wrangler d1 execute hello-ai -c wrangler.dev.toml --env production --local --file=./migrations/001_init.sql
npx wrangler d1 execute hello-ai -c wrangler.dev.toml --env production --local --file=./migrations/002_proposals.sql
npx wrangler d1 execute hello-ai -c wrangler.dev.toml --env production --local --file=./migrations/003_auth_multitenant.sql

echo "=== Starting wrangler dev ==="
exec npx wrangler dev -c wrangler.dev.toml --env production --port 3000 --ip 0.0.0.0
