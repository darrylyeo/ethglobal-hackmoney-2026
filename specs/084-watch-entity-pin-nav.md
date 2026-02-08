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

This is computed **once** in `+layout.svelte` and consumed by:

1. **Navigation items** – each watched entity is placed under the most relevant
   existing nav section (see below), not in a separate "Watched" section.
2. **Global graph query stack** (spec 058) – the global stack is exactly the
   set of watched entities (replaces the current hardcoded wallet-connections +
   sessions + wallets).
3. **GraphScene entity scope** (spec 083) – the global graph visualizes watched
   entities by default; toggles/filters control what additional entities are shown.

### Eliminating redundant queries and derivations

Today, `+layout.svelte` independently queries `walletConnectionsCollection`,
`SessionsCollection`, `walletsCollection`, and
`watchedEntitiesCollection`, then builds separate `accountNavItems`,
`watchedNavItems`, session nav children, etc. With this spec:

- **`accountNavItems`** is derived from the `wallet-connection` subset of the
  unified watched set (same data, one derivation path).
- **Session nav children** include `session-active` watched sessions.
- **`watchedNavItems`** (separate top-level section) is **removed**; manual
  watches appear under the relevant section instead.
- The **global live query stack** (`registerGlobalLiveQueryStack`) is built from
  the unified watched set, replacing the current hardcoded list.

The existing `walletConnectionsQuery`, `sessionsQuery`, `walletsQuery` in layout
remain (they feed other derivations like `relevantNetworkConfigs`), but nav and
graph consumers read from the single unified watched view.

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
- For entities with an automatic source, the button shows "Watching" (disabled /
  informational) since the entity is already in the set.
- For entities without an automatic source, the button shows "Watch" / "Unwatch"
  and writes/deletes from `watchedEntitiesCollection`.

## `watchedEntitiesCollection` schema

Unchanged from current implementation (manual watches only):

```ts
type WatchedEntityRow = {
	entityType: EntityType
	id: string
	label: string
	href: string
	addedAt: number
	$source: DataSource // always DataSource.Local
}
```

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

Spec updated. Previous implementation (v1: separate Watched nav section,
manual-only) to be refactored.
