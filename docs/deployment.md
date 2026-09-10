# Deployment and authentication

## Current hosting model

ConnectKon builds to a Cloudflare Worker and client assets through Vinext. The hosted application uses OpenAI Sites, which provisions the logical D1 binding and manages the ChatGPT sign-in flow.

The GitHub release contains a generic `.openai/hosting.json` with `d1: "DB"` and `r2: null`. It does not contain the original site's project ID. Register a separate Site when deploying your own instance and preserve the ID assigned to it. Do not copy another deployment's credentials or binding IDs.

## Local database

`wrangler.local.jsonc` contains a development-only database identifier and points Wrangler at the committed `drizzle` migrations. Run:

```sh
pnpm db:migrate:local
pnpm dev
```

Both local tooling and the Vite Cloudflare plugin use `.wrangler/state`. This directory is ignored and must not be uploaded.

## Runtime configuration

| Setting | Purpose |
| --- | --- |
| `DB` | D1 binding for the `usage_events` table |
| `ANALYTICS_OWNER_EMAIL` | Verified ChatGPT email allowed to read owner analytics |

Copy `.env.example` to `.dev.vars` for local testing. Configure the production owner email through the hosting platform's runtime secret settings. The local file is not a production configuration mechanism.

## Authentication boundary

The public canvas requires no login. `/admin` starts sign-in through the Sites-owned `/signin-with-chatgpt` path. The application does not implement the identity provider or callback endpoint.

Identity headers are trusted only because the hosting dispatcher supplies and protects them. If you move to a different host, replace this integration with verified server-side authentication and ensure clients cannot forge the headers. A signed-in account must still pass the owner allowlist.

## Production workflow

1. Configure the logical D1 binding and owner runtime secret on your own deployment.
2. Generate and review any new migration with `pnpm db:generate`.
3. Run `pnpm typecheck`, `pnpm test` and `pnpm build`.
4. Use the Sites source/version/deployment workflow to publish the built Worker, assets and committed migrations.
5. Confirm the homepage loads and anonymous requests to `/api/analytics/summary` return `401`.
6. Sign in as the owner and verify the dashboard; a different account must not receive the aggregates.

Production migrations are applied by Sites. The local migration command intentionally never uses `--remote`. Applied production migrations must remain immutable.

GitHub hosting of the source does not automatically redeploy the live site. No automatic production deployment workflow is included in v1.0.0.
