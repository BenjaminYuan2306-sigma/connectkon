# Contributing

Thanks for taking an interest in ConnectKon. The first release focuses on a useful visual network, structured relationship memory and simple follow-ups.

## Before changing code

1. Read the README and the relevant architecture notes.
2. Open an issue to discuss substantial changes before implementing them.
3. Use fictional contacts and conversations in examples and bug reports.

## Development workflow

1. Create a branch with a descriptive name, for example `fix/canvas-selection`.
2. Keep a change focused on one problem or workflow.
3. Add meaningful checks when changing persistence, validation, authorization or analytics.
4. Run `pnpm typecheck`, `pnpm test` and `pnpm build`.
5. In the pull request, describe the problem, resulting behavior, checks run and any remaining limitations.

Use concise commit messages such as `fix: preserve the canvas viewport` or `docs: clarify local data storage`. Avoid unrelated formatting or dependency updates.

## Database and authorization changes

Generate migrations from `db/schema.ts`. Never rewrite a migration that has already been deployed. Use bound, single-statement prepared queries. Keep authorization checks on the server, and do not trust identity headers from an arbitrary client or host.

## Reporting a problem

Include the browser, a short sequence of steps, expected behavior, actual behavior and whether it reproduces in the example network. Screenshots should not contain personal contacts, emails or conversation content. Do not attach a real workspace export to a public issue.

See the README's license section before redistributing a modified version.
