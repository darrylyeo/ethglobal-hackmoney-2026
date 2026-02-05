# Spec 046: Transaction sessions

Introduce transaction sessions that track a transaction flow from draft to
submission to on-chain finalization. Transaction flow pages create, persist, and
sync sessions via a dedicated TanStack DB collection, with URL-hash driven entry
and navigation.

## Scope

- All pages that render a transaction flow (TransactionFlow-backed routes).
- Dedicated `transaction-sessions` TanStack DB collection.
- URL hash handling for session bootstrap and navigation.
- Session lifecycle and edit locking rules.
- Normalize session params at the collection boundary using ArkType.
- Navigation state tags for Draft, Submitted, Finalized.
- Replace legacy per-flow hash state and local draft state.

## Non-goals

- No backward compatibility for legacy hash formats.
- No duplicate draft state outside the session object.
- No new analytics or telemetry.

## Definitions

### Transaction session

A persisted record that represents a transaction session, containing one or more
actions (swap, transfer, bridge) that together define the user flow.

### Lifecycle

- `Draft`: editable parameters, no on-chain submission.
- `Submitted`: parameters locked, transaction hash known.
- `Finalized`: on-chain finalization confirmed.

## Data model sketch

```ts
type TransactionSession = {
	id: string
	actions: (
		| 'swap'
		| 'bridge'
		| 'transfer'
	)[]
	status: 'Draft' | 'Submitted' | 'Finalized'
	createdAt: number
	updatedAt: number
	lockedAt?: number
	params: Record<string, unknown>
	latestSimulationId?: string
	simulationCount?: number
	execution?: {
		submittedAt: number
		txHash?: `0x${string}`
		chainId?: number
	}
	finalization?: {
		at: number
		receipt?: Record<string, unknown>
	}
}
```

## URL hash rules

### Bootstrap

- Single base route: `/session`.
- Session initialization comes from the hash:
  - `/session#[action-slug]`
  - `/session#[action-1-slug]|[action-2-slug]`
  - `/session#[action-1-slug]:{JSON params}|[action-2-slug]:{JSON params}`
- When the hash contains action slugs, create a new session with `actions` in
  order, persist it, and replace the hash with `#session:<id>`.
- When an action slug includes JSON params, treat them as the initial `params`
  payload (partial values allowed).
- If there is no hash, create a new session using default params and replace the
  hash with `#session:<id>`.

### Session navigation

- If the hash matches `#session:<id>`, load the session and hydrate the form
  from `params`.
- Any edit to form parameters updates `params` and `updatedAt` in the session.
- When the session is locked, form inputs that affect parameters are disabled
  and edits are rejected.

## Locking and results

- Simulation locks the session parameters, writes `lockedAt`, creates a new
  session simulation row, and updates `latestSimulationId` + `simulationCount`.
- Execution locks the session parameters, writes `execution.submittedAt`, and
  persists the transaction hash when known.
- Finalization updates `status` to `Finalized` and writes `finalization`.
- Locked sessions (simulated or submitted) can be forked into a new Draft
  session that copies `flows` and `params`, resets `status`, and clears lock,
  simulations, execution, and finalization fields.
- To change parameters after locking, create a new Draft session seeded from the
  locked session and navigate to its hash.

## Simulation storage

- Use a dedicated `transaction-session-simulations` TanStack DB collection.
- Each simulation row includes `sessionId` for joining and a params hash for
  grouping results by identical inputs.
- Session rows store only `latestSimulationId` and `simulationCount`.
- Simulation rows persist `paramsHash` to group results by identical inputs.

## Sessions route and navigation

- Introduce a dedicated sessions route: `/session`.
- Replace dedicated action routes (`/swap`, `/bridge`, `/transfer`) with the
  single `/session` route.
- Move action views to `src/view/[action-slug]` and have `/session` consume them.
- Navigation structure (in `+layout.svelte`): **Actions** (defaultOpen; children: Transfer, Swap, Bridge, Manage Liquidity) above **Sessions** (defaultOpen: false; tag = session count); **Accounts** (defaultOpen; flattened list of wallet + watching accounts, each with icon when available and tag = wallet name or "Watching", href `/accounts`); **Coins** (defaultOpen; child: USDC → `/explore/usdc`); **Multiplayer** (defaultOpen; children: Rooms with count tag, Yellow Channels); **Tests** (defaultOpen).
- Sessions parent has `[data-tag]` with session count; session child items have `[data-tag]` for status. Rooms shows room count in `[data-tag]`. Accounts shows count and each account item has tag (wallet name or Watching) and optional icon.
- Session navigation items resolve to `/session#[action-slug]` (and session list to `/sessions`).

## Navigation tags

- Sessions parent: `[data-tag]` shows number of sessions. Child items: `[data-tag]` indicates `Draft`, `Submitted`, or `Finalized`.
- Accounts: parent `[data-tag]` = count; each child has `[data-tag]` = wallet name or "Watching", and icon when from EIP-6963 wallet.
- Rooms (under Multiplayer): `[data-tag]` shows number of rooms.
- Session navigation items resolve to `/session#[action-slug]`.

## Flow adoption

- Swap, bridge, and transfer actions read and write `TransactionSession.params`
  as the single source of truth.
- Action-specific view models derive from `params` without duplicating state.
- Form edits never mutate URL hash directly beyond the `#session:<id>` form.
- TransactionFlow owns execution orchestration, and actions only provide
  specifics.
- Intents resolve to a session with one or more actions, and params may be
  partially filled out.

## Acceptance criteria

- [x] `transaction-sessions` collection exists in TanStack DB with persistence.
- [x] Transaction flow routes accept JSON hashes, create sessions, and replace
  the hash with `#session:<id>`.
- [x] Routes hydrate form state from `TransactionSession.params`.
- [x] Any form edits sync back into the active session in TanStack DB.
- [x] Session params are normalized at the collection boundary using ArkType.
- [x] Simulation and execution lock parameter edits and persist results.
- [x] Simulations are stored in `transaction-session-simulations` with a
  `sessionId` join key.
- [x] Multiple simulations can be stored for the same locked params.
- [x] Sessions update to `Submitted` and `Finalized` with persisted metadata.
- [x] A new draft session is created when users change parameters after locking.
- [x] Locked sessions can be forked into a new Draft session with copied params.
- [x] Navigation includes Actions, Sessions (count tag, child items per session), Accounts (flattened wallet/watching accounts with icon and tag), Coins (USDC), Multiplayer (Rooms with count tag, Yellow Channels), Tests. Actions, Accounts, Coins, Multiplayer, Tests defaultOpen; Sessions defaultOpen: false.
- [x] Session child items and Sessions/Rooms parents include `[data-tag]` (status or count).
- [x] Legacy hash formats are removed without backward compatibility shims.
- [x] `/session` is the single base route for all action flows.
- [x] Action views live in `src/view/[action-slug]` and are composed by
  `/session`.
- [x] Navigation items (Swap, Transfer, Bridge) target `/session#[action-slug]`.
- [x] Session bootstrap supports multi-action hash syntax and JSON params.

## TODOs

- TODO: Confirm default `flow` values for each route.
- TODO: Define the minimal `params` shape per flow.
- TODO: Decide whether to expose session timestamps in UI.

## Status

Complete. Single base route `/session`; action views in `src/view/` (bridge.svelte, swap.svelte, transfer.svelte, liquidity.svelte) composed by session +page. Nav items target `/session#[action-slug]`. Bootstrap: hash `#action`, `#action|action2`, `#action:{JSON}` or empty creates session and replaces hash with `#session:<id>`.

## Output when complete

`DONE`
