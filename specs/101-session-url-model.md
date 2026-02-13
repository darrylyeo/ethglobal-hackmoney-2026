# Spec 101: Session URL model (local vs persisted)

Defines the separation between local (unpersisted) sessions at `/session?…` and
persisted sessions at `/session/[id]`. Local sessions bootstrap from URL params;
persistence and redirect happen on first form edit.

## Supersedes

Session URL and bootstrap behavior from specs 046, 082. The component structure
(Session, ActionsSequence, Action) and data model remain unchanged.

## Definitions

### Local session

A session at `/session` with query params. Not persisted to TanStack DB until
the user edits the form. Represented in memory with an ephemeral id
(`ephemeral-{uuid}`).

### Persisted session

A session at `/session/[id]`. Loaded from TanStack DB. Edits sync to the
collection.

## URL model

### `/session` (local)

- **Initial state** from load data, derived from URL:
  - `?template={ActionType}` — e.g. `?template=Transfer`, `?template=Swap`
    - Build session from template (single action, default params)
  - `?session={devalue}` — devalue-serialized Session object (base64-safe)
    - Parse and use as initial session (strip/generate new id for ephemeral)
- If neither: default to Swap template
- **No persistence** until first form interaction

### Persist on first edit

When the form state first changes (session.actions or session.params differ from
initial):

1. Create session in TanStack DB via `createSession`
2. Navigate to `/session/[id]` (replaceState or setPanelRoute)
3. Subsequent edits sync to the persisted session

Opening a select or focusing an input without changing a value does not trigger
persist.

### `/session/[id]` (persisted)

- Load session from DB by `id`
- All edits sync to TanStack DB
- No redirect; user stays on this URL

## Data flow

- Load function: `+page.ts` reads `url.searchParams.get('template')` and
  `url.searchParams.get('session')`; returns `{ template, session }` (session
  parsed from devalue when present)
- Page: uses `data.template` and `data.session` for initial state; passes
  `onPersist` to Session when local (ephemeral)
- Session.svelte: `$effect` watches session.actions and session.params; when
  they differ from initial snapshot, triggers `onPersist` once (when
  `onPersist` is defined and not yet persisted)

## Acceptance criteria

- [x] `/session?template=Transfer` shows Transfer form; first edit persists and
  redirects to `/session/[id]`
- [x] `/session?session={devalue}` deserializes and shows that session; first
  edit persists and redirects
- [x] `/session` (no params) defaults to Swap template
- [x] `/session/[id]` loads from DB; edits sync; no redirect
- [x] Navigation items for action types link to `/session?template={type}`
- [x] No ephemeralKey or page.state.sessionState for bootstrap; use load data

## Status

Complete. Load function in +page.ts returns SessionInput from `getSessionInputFromUrl`;
SessionLocal.svelte owns state, persists on first form focus via onPersist;
`{#key urlKey}` forces remount when URL params change.
