# Spec 084: Watched entities – sole source of truth for nav

The `watchedEntitiesCollection` (TanStack DB, localStorage) is the **only**
source of truth for which entities appear in the nav. No derived or automatic
sources; the nav is downstream of this collection.

## Watch source

| Source | Enters when | Leaves when |
|---|---|---|
| Manual | User clicks Watch on an entity page (WatchButton) | User clicks Unwatch |

All watches persist as `WatchedEntityStoredRow` in `watchedEntitiesCollection`.
`deriveWatchedEntityRow` produces full rows (id, label, href) for consumers.

## Default watched entities

On profile creation (and migration when WatchedEntities is empty), a default set
is seeded via `seedDefaultWatchedEntities()` / `defaultWatchedEntitiesBlob()`:

- **Networks:** Ethereum, Base, Ethereum Sepolia, Base Sepolia
- **Coins:** ETH, USDC
- **Actor:** vitalik.eth (Ethereum mainnet)

Defined in `src/constants/default-watched-entities.ts`.

## Nav placement

Watched entities appear as children under the **most relevant existing nav
section**:

| Entity type | Nav section |
|---|---|
| `Actor` | **Accounts** (or **Multiplayer > Peers** when also a verified peer) |
| `Session` | **Sessions** |
| `Network` | **Explore > Networks** |
| `Contract` | **Explore > Networks** (as child of its network) |
| `Coin` | **Explore > Coins** |
| `Room` | **Multiplayer > Rooms** |
| `AgentChatTree` | **Agents** |

## WatchButton behavior

- On single-entity page headers (via EntityView when `entityId != null`).
- **Props:** `entityType`, `entityId`. No label/href; those are derived.
- Always shows "Watch" / "Unwatch" and toggles `watchEntity` / `unwatchEntity`.
- No `autoWatched` — watch state is fully derived from `watchedEntitiesCollection`.

## `watchedEntitiesCollection` schema

**Persisted (storage):** `entityType`, `entityId` (typed `EntityId`), and
`addedAt`. Label and href are derived at read time via `deriveWatchedEntityRow`.

**API:** `watchEntity({ entityType, entityId })`; `unwatchEntity(entityType, entityId)`; `listWatchedEntities()` returns derived rows. See spec 093 for typed `EntityId` shapes and derivation rules.

## Acceptance criteria

- [x] `watchedEntitiesCollection` is the sole source for nav entity children.
- [x] Sessions, Accounts, Rooms, Agents, Coins, Networks nav children all derive from WatchedEntities.
- [x] Default set (Ethereum, Base, Ethereum Sepolia, Base Sepolia, ETH, USDC, vitalik.eth) seeded on profile creation.
- [x] WatchButton always visible when `entityId != null`; no `autoWatched`.
- [x] Nav sections (Sessions, Accounts, etc.) show only entities from WatchedEntities.

## Status

Complete. WatchedEntities is sole source; default set in `default-watched-entities.ts`; profile creation and migration seed it.
