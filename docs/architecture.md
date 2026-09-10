# Architecture

## Application model

The map is the main working surface. Opening a connection switches to a dedicated person workspace using a `#connection/<id>` hash. Returning to the map preserves its viewport.

`lib/network.ts` defines four normalized entities:

| Entity | Responsibility |
| --- | --- |
| Person | Profile, relationship information, follow-up, university marker and canvas position |
| Conversation | A dated interaction referencing a person by `connectionId` |
| Relationship | An edge between two people, including its label and notes |
| TextNode | A movable, resizable annotation on the canvas |

Job title is stored as `role`; `position` is reserved for canvas coordinates. Conversation count is derived from logged records plus the optional prior unlogged count. Last contact is the latest date from the baseline field and recorded conversations.

## Local workspace state

`hooks/use-network.ts` owns updates, a 50-entry snapshot history and debounced saves through `lib/persistence.ts`. The persistence adapter handles localStorage and validated JSON backups. Conversation records and edges are removed together with their owning person after confirmation.

The map uses React Flow. Its node components render compact profiles and text, while the board handles selection, movement, zoom and edge creation. Relationship strength and the same-university marker are independent properties.

## Server analytics

The public client sends only allowlisted usage events to `/api/analytics/event`. The route validates payload size, field names, event type, origin and identifier shape; deduplicates event IDs; hashes the random browser identifier; and inserts a bound query into D1.

`/api/analytics/summary` checks owner authorization before querying totals, daily visitor counts, returning browsers and feature counts. `/admin` provides the sign-in gate and dashboard. Aggregates are not stored in the contact workspace.

The reporting day is Bangkok time (UTC+7). Collection and summary reads prune expired events. Client identifiers expire after 90 days. See [privacy.md](privacy.md) for the precise counting model.

## Boundaries

- Contact content does not enter the analytics database.
- The analytics database is durable, but contact data remains device-local by design.
- Runtime owner identity comes from Sites-managed authenticated headers and a configured email allowlist.
- The source repository contains no live workspace export, runtime secrets or deployment credentials.
- Cloud sync, collaboration and app-owned public authentication are not implemented.
