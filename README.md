# ConnectKon

**Your professional network, mapped.**

ConnectKon is a canvas-first networking CRM for keeping track of people, conversations, and the relationships between them. Organize your LinkedIn connections visually, remember what you discussed, and plan the next follow-up.

**Version:** 1.0.0 · **Status:** Initial release · **Primary platform:** Desktop web

[Live application](https://connectkon-network.yuanfei758.chatgpt.site/) · [中文介绍](README.zh-CN.md) · [Changelog](CHANGELOG.md) · [Architecture](docs/architecture.md)

## Why ConnectKon?

Adding someone on LinkedIn is the beginning of a relationship. Remembering how you met, what you talked about, and when to reconnect is the part that often gets lost.

ConnectKon gives that context a home:

- **People:** compact, draggable connection cards.
- **Relationships:** labeled lines linking people on an infinite canvas.
- **Memory:** structured conversation histories inside each person's workspace.

## Features

| Area | Included in v1.0.0 |
| --- | --- |
| Network canvas | Pan, zoom, fit view, draggable cards, multi-selection, editable and resizable text nodes |
| Connections | LinkedIn URL validation, duplicate detection, relationship strength, tags, priorities, profile details and notes |
| Relationship map | Persistent edges with types, labels and notes |
| University marker | A same-university checkbox adds a gold star to the card's corner |
| Conversation history | Separate dated entries, custom topics, summaries, takeaways, private notes and checkable action items |
| Follow-ups | Due dates, overdue/today/upcoming groups and a separate next-conversation field |
| Discovery | Network-wide search, conversation search and combined filters |
| Reliability | Local autosave, up to 50 undo/redo snapshots, validated JSON import/export and deletion confirmations |
| Owner analytics | Protected visitor trends, returning-browser estimates and feature-use counts backed by Cloudflare D1 |

## Try the application

Open [ConnectKon](https://connectkon-network.yuanfei758.chatgpt.site/) and select **Add Connection**. Enter a name and LinkedIn profile URL, then drag the card into place. Drag between card handles to create a relationship; click a card to open its workspace.

The empty workspace also offers a fictional example network. Example profile URLs are placeholders, not verified LinkedIn profiles.

> **Save a backup:** contacts and conversations are stored in the current browser. They do not sync between devices or browsers. Use **Settings → Export Data** before clearing browser data or moving to another device.

## Quick start

### Requirements

- Node.js **24.x** (the verification scripts use Node's built-in SQLite module).
- pnpm **11.19.0**.
- A desktop browser for the full canvas experience.

From a clone or downloaded copy of this repository:

```sh
pnpm install --frozen-lockfile
pnpm db:migrate:local
pnpm dev
```

Open the local address printed by the development server, normally `http://localhost:3000`.

The first command installs the pinned dependency graph. The second applies migrations to a **local** D1 database; it does not modify the live application. The canvas can be used without configuring an owner account.

### Owner analytics configuration

Copy `.env.example` to `.dev.vars` for local development and set:

```dotenv
ANALYTICS_OWNER_EMAIL=your-owner-account@example.com
```

Use the identity supplied by the local Sites sign-in flow when testing locally. Production uses a separately configured runtime secret, not this local file. See [deployment and authentication](docs/deployment.md).

`/admin` is available only to the configured owner after ChatGPT sign-in. Anonymous users can use the public canvas but cannot read aggregate analytics. Sign-in alone does not grant ownership.

### Commands

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Start the local development server |
| `pnpm build` | Build the Cloudflare Worker and client assets |
| `pnpm start` | Serve the generated Worker locally with Wrangler |
| `pnpm typecheck` | Check TypeScript types |
| `pnpm test` | Run both data-integrity and analytics verification suites |
| `pnpm db:generate` | Generate Drizzle migrations from the schema |
| `pnpm db:migrate:local` | Apply pending migrations to local D1 |
| `pnpm lint` | Run the configured linter |
| `pnpm format` | Run the configured formatter |

## Keyboard shortcuts

| Shortcut | Action |
| --- | --- |
| `N` | Add a connection |
| `T` | Add a text node on the map |
| `Delete` / `Backspace` | Delete selected map nodes after confirmation |
| `Ctrl` / `Cmd` + `F` | Search the network |
| `Ctrl` / `Cmd` + `Z` | Undo |
| `Ctrl` / `Cmd` + `Shift` + `Z` | Redo |
| `Escape` | Close or cancel the active dialog |

Canvas shortcuts do not run while typing into form fields. Use the hand tool to pan and `Shift` to multi-select.

## Technology

- **React 19 + TypeScript** for the application.
- **React Flow 12** for the network canvas.
- **Vinext + Vite** for routing, rendering and builds.
- **Base UI / Shadcn** for accessible interface primitives.
- **Cloudflare Workers + D1** for server-side analytics.
- **Drizzle** for versioned database migrations.
- **Recharts** for the owner dashboard.

The current deployment uses OpenAI Sites. Its sign-in dispatcher and trusted identity headers are required by the owner analytics authorization path. Moving to another host requires adapting that path; this is not an arbitrary-host authentication starter.

## Project structure

```text
app/                         Routes, shared layout and styles
  admin/                     Owner dashboard entry and authorization gate
  api/analytics/             Collection, access and aggregate endpoints
components/
  connectkon/                Canvas, connection forms, workspace and panels
  analytics/                 Owner analytics dashboard
  ui/                        Shared interface primitives
hooks/use-network.ts         State, autosave and undo/redo
lib/                        Domain types, persistence and analytics helpers
db/                         Analytics schema and D1 access
drizzle/                    Generated database migrations
docs/                       Architecture, privacy and deployment notes
verify.mjs                  Workspace data-integrity checks
verify-analytics.mjs        Analytics contract and SQLite checks
```

## Data and privacy

Connection data stays in browser `localStorage`. Analytics is a separate, server-backed system: it records an allowlisted event name, a hashed random browser identifier, an event identifier and a timestamp. It does **not** collect contact details, conversation content or IP addresses.

Visitors can disable collection in **Settings → Share basic usage statistics**. Do Not Track and Global Privacy Control signals are respected. Read the [data and privacy notes](docs/privacy.md) for retention, counting definitions and limitations.

ConnectKon does not scrape LinkedIn, send external reminders, provide cloud contact synchronization or generate AI summaries.

## Validation and release scope

The v1.0.0 release includes two automated verification suites: 11 workspace data checks and 11 analytics checks. The analytics suite exercises route handlers with a SQLite-backed test adapter, including authorization rejection, duplicate events, aggregation and privacy preferences.

These checks do not constitute a full browser interaction or accessibility audit. Browser UI automation and the optional WebMCP runtime contract have not been verified. The pinned Vinext dependency is a beta release.

Known v1 limitations:

- Contact data is browser-local; there is no account-based contact sync or collaboration.
- Notes and the next-conversation editor save when they lose focus.
- Undo history is session-local and capped at 50 snapshots.
- Analytics visitors are estimated browsers, not verified individuals.
- Mobile layout is simplified; desktop is the primary experience.
- Google search indexing is not configured by the analytics feature.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for the development workflow and issue-reporting guidance. Keep changes focused on the canvas, relationship memory and reliable follow-up workflows.

## License

An open-source license has not been selected for this initial release. No project-level license grant is included.
