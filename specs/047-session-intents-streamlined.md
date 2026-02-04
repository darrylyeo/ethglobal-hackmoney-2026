# Spec 047: Streamlined session intents

This spec overrides and replaces any conflicting requirements in
`specs/046-transaction-sessions.md`. Prefer this spec for session flow behavior,
UI composition, and persistence rules. Hash-based URL initialization and
simulation/transaction storage requirements from earlier specs remain valid.

## Scope

- Transaction flow routes and intents.
- Session UI components: `<Session>` and `<SessionAction>`.
- Session persistence and locking behavior.
- Protocol/route modeling for action execution.
- TanStack DB normalization at the collection boundary.

## Non-goals

- No incremental tweaks to existing flow components; rewrite simply from scratch
  while preserving overall functionality.
- No new analytics or telemetry.

## Definitions

### Session

A local-first object representing a transaction flow with context and actions.

### Context

- Wallet(s) (single or multiple).
- Network environment: `Mainnet` or `Testnet`.

### Action

An intentful unit within a session (swap, bridge, transfer, etc.) rendered as a
three-column `<SessionAction>` row with a dedicated `<form>`.

## UI composition

- `<Session>` renders session context and a list of actions.
- Each action is rendered by `<SessionAction>` as a three-column card row:
  - Column 1: parameters (from, to, amount, etc.).
  - Column 2: protocol selection and settings.
  - Column 3: preview (read-only summary/visualization) and
    simulation/submission controls (form submit buttons).
- Specialized action components consume `<SessionAction>` and define the
  relevant UI inside snippet content.

## Protocol selection

- Available protocols depend on the action params and supported intents.
- Protocol settings depend on the selected protocol.
- Protocols/routes are modeled with minimal, explicit fields following existing
  conventions; add or modify fields only when necessary to support supported
  intents.
- Normalize API data at the TanStack DB collection boundary.

## Persistence and locking

- Do not create and persist a new session on initial render.
- Bind form state directly to a local session state object.
- Persist the session only when the user triggers:
  - `Save Draft`
  - `Simulate`
  - `Sign and Submit`
- On successful `Simulate` or `Sign and Submit`, lock the persisted session.
- Locking is internal and does not disable or block edits to column 1 or 2 form
  fields. These edits continue to mutate local state.
- When locked, the next successful form submission creates a new session object
  and inserts it into the DB, seeded from local state.
- Users may run `Simulate` multiple times before `Sign and Submit`.
- Do not mark or persist state changes when an action fails to complete (for
  example, the user rejects the wallet signature).

## Acceptance criteria

- [ ] `<Session>` and `<SessionAction>` exist and render actions as three-column
  form rows with the specified column responsibilities.
- [ ] Specialized action components consume `<SessionAction>` and provide
  snippet content for action-specific UI.
- [ ] Session context includes wallet(s) and mainnet/testnet environment.
- [ ] Local session state is the default source of truth until `Save Draft`,
  `Simulate`, or `Sign and Submit`.
- [ ] Sessions are only persisted on those actions and never on initial render.
- [ ] Successful `Simulate` or `Sign and Submit` locks the persisted session,
  but form fields in columns 1 and 2 remain editable.
- [ ] When locked, the next successful submit creates a new session record in
  the DB based on the local state.
- [ ] Users can run `Simulate` repeatedly before `Sign and Submit`.
- [ ] Failed actions (including signature rejection) do not update or persist
  session state.
- [ ] Protocol availability depends on params and supported intents; protocol
  settings depend on the selected protocol.
- [ ] API data is normalized at the TanStack DB collection boundary.

## TODOs

- TODO: Define the minimal protocol/route field set per intent.
- TODO: Specify the minimal session params shape per action type.

## Status

Proposed.
