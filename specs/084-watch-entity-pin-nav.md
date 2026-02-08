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
| `session-active` | `TransactionSession` | Session `status` is `'Draft'` or `'Submitted'` | Session becomes `'Finalized'` |
| `transaction-recent` | `Transaction` | Transaction `status` changes to `'completed'` or `'failed'` | TODO: manual unwatch or TTL expiry |
| `manual` | any watchable | User clicks Watch on a single-entity page header | User clicks Unwatch |

Automatic sources (`wallet-connection`, `session-active`, `transaction-recent`)
are **derived**; they do NOT write rows to `watchedEntitiesCollection`.
`manual` watches persist in `watchedEntitiesCollection` (localStorage) as today.

### Unified view

A single derived `$derived` (or reactive helper) merges all four sources into
one `WatchedEntity[]`:

```ts
type WatchedEntity = {
	entityType: EntityType
	id: string
	label: string
	href: string
	source: 'wallet-connection' | 'session-active' | 'transaction-recent' | 'manual'
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
`transactionSessionsCollection`, `walletsCollection`, and
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

## Nav placement

Watched entities appear as children under the **most relevant existing nav
section**, determined by entity type:

| Entity type | Nav section |
|---|---|
| `Actor` | **Accounts** |
| `TransactionSession` | **Sessions** |
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

- [ ] Unified `WatchedEntity[]` derived once in layout from four sources.
- [ ] `wallet-connection` accounts auto-watched; appear under Accounts nav.
- [ ] `session-active` sessions (Draft/Submitted) auto-watched; appear under
  Sessions nav.
- [ ] `transaction-recent` transactions auto-watched on completion; appear in
  nav.
- [ ] Manual watches appear under the most relevant nav section (not a separate
  top-level "Watched" section).
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
