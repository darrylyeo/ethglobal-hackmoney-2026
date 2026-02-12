# Spec 084: Watched entities – unified data scope for nav, graph, and queries

"Watched" is the **canonical set of entities the user cares about right now.**
It drives nav item visibility, the global graph visualization (spec 083), and
the global query stack (spec 058). Sources are both automatic and manual.

## Watch sources

A watched entity has a **source** discriminant that controls how it enters and
leaves the set:

| Source | Entity type | Enters when | Leaves when |
|---|---|---|---|
| `wallet-connection` | `Actor` | Account appears in a connected `WalletConnection` with `status === 'connected'` | Connection disconnected or removed |
| `session-active` | `Session` | Session `status` is `'Draft'` or `'Submitted'` | Session becomes `'Finalized'` |
| `transaction-recent` | `Transaction` | Transaction `status` changes to `'completed'` or `'failed'` | Manual unwatch or TTL expiry |
| `verified-peer` | `Actor` | Peer verified by me in a room (`Verification.status === 'verified'` where `verifierPeerId ∈ myPeerIds`) | Verification revoked or peer removed |
| `manual` | any watchable | User clicks Watch on a single-entity page header | User clicks Unwatch |

Automatic sources (`wallet-connection`, `session-active`, `transaction-recent`,
`verified-peer`) are **derived**; they do NOT write rows to
`watchedEntitiesCollection`. `manual` watches persist in
`watchedEntitiesCollection` (localStorage) as today.

### Unified view

A single derived `$derived` (or reactive helper) merges all five sources into
one `WatchedEntity[]`:

```ts
type WatchedEntity = {
	entityType: EntityType
	id: string
	label: string
	href: string
	source:
		| 'wallet-connection'
		| 'session-active'
		| 'transaction-recent'
		| 'verified-peer'
		| 'manual'
	addedAt: number
}
```

Manual watches are stored as `WatchedEntityStoredRow`; `deriveWatchedEntityRow` produces the full row for consumers. The unified view (manual + automatic sources) is computed in the **navigation items module** (spec 091) and consumed by:

1. **Navigation items** – each watched entity is placed under the most relevant
   existing nav section (see below), not in a separate "Watched" section.
2. **Global graph query stack** (spec 058) – the global stack is built in the same
   module via `registerGlobalLiveQueryStack` (wallet-connections, sessions, wallets,
   transactions, watched entities).
3. **GraphScene entity scope** (spec 083) – the global graph visualizes watched
   entities by default; toggles/filters control what additional entities are shown.

### Eliminating redundant queries and derivations

**Current implementation:** All nav-related queries and derivations live in
`src/routes/navigationItems.svelte.ts`. The layout calls `useNavigationItems({ isTestnet })`
(spec 091), which runs the live queries (walletConnections, sessions, wallets,
watchedEntities, etc.), `ensureDefaultRow`, and `registerGlobalLiveQueryStack`, and
returns a single reactive `NavigationItem[]`. No nav-specific queries or
derivations remain in `+layout.svelte`.

- **`accountNavItems`** and session/network/room/peer nav children are derived
  inside `getNavigationItems` from the same query data.
- **Manual watches** are derived from `watchedEntitiesCollection` via
  `deriveWatchedEntityRow` and appear under the relevant section (Explore >
  Networks, etc.).
- The **global live query stack** is registered inside `useNavigationItems`.

## Nav item visibility: watched vs. current-page expansion

Each nav section has two pools of children:

- **All children:** the full set of entities for that section (e.g. all sessions,
  all rooms, all networks with data).
- **Watched children:** only those in the watched entity set.

The nav shows:

| Condition | Children shown |
|---|---|
| **Current page is within the section** (the section href or any descendant href matches `$page.url.pathname`) | **All children** (full list) |
| **Current page is elsewhere** | **Watched children** only |

This means:
- Navigating to `/sessions` expands the Sessions section to show all sessions.
- Navigating away collapses it to show only active (watched) sessions.
- Navigating to `/rooms/abc` shows all rooms under Multiplayer > Rooms.
- Static nav items (Actions, Positions, Tests, etc.) are unaffected — they
  always show their hardcoded children.

Implementation: each nav section that has dynamic children builds both `children`
(watched) and `allChildren` (full list). The `NavigationItem` type gains an
optional `allChildren` field. `NavigationItem.svelte` picks `allChildren` when
the section contains the current page, `children` otherwise.

## Nav placement

Watched entities appear as children under the **most relevant existing nav
section**, determined by entity type:

| Entity type | Nav section |
|---|---|
| `Actor` (wallet-connection) | **Accounts** |
| `Actor` (verified-peer) | **Multiplayer > Peers** |
| `Actor` (manual) | **Accounts** |
| `Session` | **Sessions** |
| `Transaction` | **Sessions** (or a "Recent" sub-section) |
| `Network` | **Explore > Networks** |
| `Block` | **Explore > Networks** (as child of its network) |
| `Coin` | **Explore > Coins** |
| `Room` | **Multiplayer > Rooms** |
| `AgentChatTree` | **Agents** |

Manual watches for entity types that don't have a natural section fall back to a
**Pinned** top-level section (visible only when needed).

Items from automatic sources are **not distinguishable** in the nav from items
that would normally appear there (e.g. a wallet-connection account looks the
same as before). Items from `manual` source get a 📌 icon or subtle indicator.

## WatchButton behavior

- On single-entity page headers (right side, after entity-type annotation).
- **Props:** `entityType`, `id` (used as `entityId`). No label/href; those are derived from entityType + entityId when building nav/list.
- For entities with an automatic source, the button shows "Watching" (disabled /
  informational) since the entity is already in the set.
- For entities without an automatic source, the button shows "Watch" / "Unwatch"
  and calls `watchEntity({ entityType, entityId: id })` / `unwatchEntity(entityType, id)`.

## `watchedEntitiesCollection` schema

**Persisted (storage):** only `entityType`, `entityId`, and `addedAt`. Label and href are derived at read time.

```ts
type WatchedEntityStoredRow = {
	entityType: EntityType
	entityId: string
	addedAt: number
}
```

**Derived row** (used by nav and list consumers): `deriveWatchedEntityRow(stored)` returns:

```ts
type WatchedEntityRow = WatchedEntityStoredRow & {
	id: string      // `${entityType}:${entityId}`
	label: string
	href: string
}
```

- **Coin:** `entityId` = symbol → `href = /coin/${entityId}`, `label = entityId`.
- **Network:** `entityId` = slug → `href = /network/${entityId}`, `label` from `getNetworkBySlug(entityId)`.
- **Contract:** `entityId` = `"slug:address"` → `href = /network/${slug}/contract/${address}`, `label = formatAddress(address)`.
- **Other:** `label = entityId`, `href = #${entityId}`.

**API:** `watchEntity({ entityType, entityId })`; `unwatchEntity(entityType, entityId)`; `listWatchedEntities()` returns derived rows. Legacy rows (stored with `id` and optional `label`/`href`) are supported for migration; `getEntityId(row)` and derivation handle both shapes.

## Acceptance criteria

- [ ] Unified `WatchedEntity[]` derived once in layout from five sources.
- [ ] `wallet-connection` accounts auto-watched; appear under Accounts nav.
- [ ] `session-active` sessions (Draft/Submitted) auto-watched; appear under
  Sessions nav.
- [ ] `transaction-recent` transactions auto-watched on completion; appear in
  nav.
- [ ] `verified-peer` accounts auto-watched; appear under Multiplayer > Peers
  nav.
- [ ] Manual watches appear under the most relevant nav section (not a separate
  top-level "Watched" section).
- [ ] Nav sections show all children when current page is within them, watched
  children only when elsewhere.
- [ ] Global graph query stack (spec 058) built from watched entities.
- [ ] GraphScene (spec 083) default scope is watched entities; toggles/filters
  control additional entities.
- [ ] No redundant derivations: `accountNavItems`, session nav children, and
  graph scope all consume the unified watched set.
- [ ] WatchButton shows "Watching" (disabled) for auto-watched entities.
- [ ] Manual watch/unwatch still persists to `watchedEntitiesCollection`.

## Status

- Stored schema (entityType + entityId only) and derivation implemented in
  `WatchedEntities.ts`; WatchButton and nav use the new API; legacy rows
  supported for migration.
- Nav logic centralized in `navigationItems.svelte.ts` (spec 091); layout uses
  `useNavigationItems` only.
- Unified watched view and full spec 084 acceptance criteria (e.g. single
  derived set, graph scope) still to be completed where not yet done.
