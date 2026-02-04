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

A persisted record that represents a transaction flow session, potentially
containing multiple steps/flows (for intent-derived routes).

### Lifecycle

- `Draft`: editable parameters, no on-chain submission.
- `Submitted`: parameters locked, transaction hash known.
- `Finalized`: on-chain finalization confirmed.

## Data model sketch

```ts
type TransactionSession = {
	id: string
	flows: (
		| 'swap'
		| 'bridge'
		| 'transfer'
		| 'liquidity'
		| 'intent'
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

- If the URL hash decodes into a JSON object, treat it as initial `params`.
- Create a new session, persist it, and immediately replace the hash with
  `#session:<id>`.
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

- Introduce a dedicated sessions route, e.g. `/session`.
- Add a Sessions parent navigation item that groups all session entries.
- Session detail routes are nested under `/session` and point to the relevant
  flow view with `#session:<id>`.

## Navigation tags

- Add child navigation items for active sessions under the sessions parent.
- Each item includes a `[data-tag]` indicating `Draft`, `Submitted`, or
  `Finalized`.
- Session navigation items resolve to the appropriate flow route with
  `#session:<id>`.

## Flow adoption

- Swap, bridge (CCTP, LiFi), transfer, and liquidity flows read and write
  `TransactionSession.params` as the single source of truth.
- Flow-specific view models derive from `params` without duplicating state.
- Form edits never mutate URL hash directly beyond the `#session:<id>` form.
- TransactionFlow owns execution orchestration, and flows only provide specifics.

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
- [x] Navigation includes a sessions parent item with child items per session.
- [x] Session child items include `[data-tag]` reflecting state.
- [x] Legacy hash formats are removed without backward compatibility shims.

## TODOs

- TODO: Confirm default `flow` values for each route.
- TODO: Define the minimal `params` shape per flow.
- TODO: Decide whether to expose session timestamps in UI.

## Status

Complete.

## Output when complete

`DONE`
