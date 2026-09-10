# Data and privacy

## Contact workspace

Contacts, LinkedIn URLs, profile fields, notes, conversations, relationships and canvas positions are stored in localStorage in the visitor's browser. The application does not upload this workspace to a contact database. JSON export is the backup and transfer mechanism.

Profile image URLs are loaded by the browser from their specified hosts. Opening a LinkedIn link navigates to LinkedIn. These are separate from usage statistics.

## Usage statistics

Collection is enabled by default unless disabled in Settings or blocked by browser privacy signals. The collector accepts only:

- A random event identifier.
- A random browser identifier, hashed on the server before storage.
- One allowlisted event: visit, connection created, conversation created, relationship created or follow-up set.

The server adds the timestamp and reporting date. It does not store names, emails, contact details, notes, conversations, IP addresses, full referrers or user-agent strings in the analytics table. Hosting infrastructure may operate its own request logs separately.

## Controls and retention

Visitors can turn off **Share basic usage statistics** in Settings. The application respects Do Not Track and Global Privacy Control. Turning off collection stops future events and removes local analytics identifiers; it does not remotely erase historical aggregates.

Browser identifiers expire after 90 days. Events older than 90 days are deleted when collection or an authorized summary request next runs. A completely idle site is cleaned on its next such request.

## What the numbers mean

- **Visitors:** distinct browser identifiers during the reporting window.
- **Visits:** deduplicated client sessions, renewed after 30 minutes without tracked activity. Another tab can create another session.
- **Returning visitors:** a browser has visits on different reporting dates in the retained history, with a visit during the last 30 days.
- **Feature use:** accepted action events and the distinct browsers generating them.

Signed-in owner activity is excluded. Device changes, private browsing and cleared storage can inflate visitor estimates. Opt-outs, blockers and request failures can reduce them. Public client events can be imitated and must not be used for billing or fraud decisions.

## Owner access

The dashboard relies on ChatGPT sign-in handled by the Sites dispatcher. Server routes compare the authenticated email to the configured `ANALYTICS_OWNER_EMAIL` secret. Missing identity, missing configuration and other signed-in accounts do not receive aggregates.
