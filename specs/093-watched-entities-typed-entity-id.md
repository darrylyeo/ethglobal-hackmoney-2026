# Spec 093: Watched entities – store entityType and entityId: EntityId directly

Watched entities (manual pins in the nav, spec 084) persist `entityType` and **typed** `entityId: EntityId` instead of a string. This aligns with the entity `$id` convention (spec 092) and keeps one source of truth for identity.

## Stored shape

- **`WatchedEntityStoredRow`**: `{ entityType: EntityType, entityId: EntityId, addedAt: number }`.
- **Key**: `entityType` + stable serialization of `entityId`, via `entityKey({ entityType, entityId })`. Implemented as `${entityType}:${stringify(entityId)}` for object ids, or `${entityType}:${entityId}` when `entityId` is a legacy string.
- **`EntityId`**: Union of all `EntityId<EntityType>` from `$/data/$EntityType.ts` (e.g. `Network$Id`, `Coin$Id`, `Contract$Id`, `ActorCoin$Id`).

## API

- **`watchEntity({ entityType, entityId })`** – insert/update by key; `entityId` is the typed object.
- **`unwatchEntity(entityType, entityId)`** – delete by `entityKey({ entityType, entityId })`.
- **`isEntityWatched(entityType, entityId)`** – has key.
- **`entityKey({ entityType, entityId })`** (from `$/lib/entity-key.ts`). Collection `getKey` uses semantic param `item: WatchedEntityStored` (spec 127). Used by callers to build the same key (e.g. WatchButton).

## Derivation (label / href)

`deriveWatchedEntity(stored)` produces `WatchedEntity` (adds `id`, `label`, `href`):

- **Typed `entityId`**: Switch on `entityType` and use the id shape. Examples:
  - **Coin**: label from `interopAddress` or token lookup; href `/coin/${symbol}`.
  - **Network**: label/name from `networkConfigsByChainId[entityId.chainId]`; href `/network/${slugForChainId(entityId.chainId)}`.
  - **Contract**: href `/network/${slug}/contract/${entityId.address}` using `slugForChainId(entityId.$network.chainId)`.
- **Legacy string `entityId`** (or legacy `id`): Still supported. Derivation infers label/href from the string (e.g. slug for Network, symbol for Coin, `slug:address` for Contract) and, where possible, reconstructs a best-effort `EntityId` for the returned item.

## Default watched entities

`DEFAULT_WATCHED_ENTITIES` uses typed ids only. Seeded on profile creation and
when WatchedEntities is empty (migration). See `src/constants/default-watched-entities.ts`:

- **Networks:** Ethereum, Base, Ethereum Sepolia, Base Sepolia (`{ chainId }`).
- **Coins:** ETH (native), USDC (first Ethereum USDC from `ercTokens`).
- **Actor:** vitalik.eth (`{ $network: { chainId: 1 }, address: '0xd8dA...', interopAddress: 'vitalik.eth' }`).

## Call sites

- **WatchButton**: Props are `entityType` and `entityId: EntityId`. No string `id`. “Is watched?” is computed by comparing `entityKey({ entityType, entityId })` to keys of stored items.
- **EntityView**: Renders WatchButton only when `entityId != null`, with `entityId` derived from `entity?.$id`.
- **networks/+page.svelte**: Passes `entityId={{ chainId: config.chainId }}`.
- **coins/+page.svelte**: Passes `entityId={{ $network: { chainId: coin.chainId }, address: coin.address, interopAddress: coin.symbol }}`.

## Backward compatibility

Existing localStorage rows that used string `entityId` (e.g. `"ethereum"`, `"USDC"`) remain valid: `deriveWatchedEntity` treats them as legacy and produces the same label/href. New watches are stored with the typed `entityId` object.

## Status

Complete. Re-verification 2026-02-21 (PROMPT_build execute one spec): All criteria confirmed—WatchedEntityStoredRow with entityType, entityId: EntityId, addedAt in src/collections/WatchedEntities.ts; entityKey (lib/entity-key) used for key format entityType:stringify(entityId) or entityType:legacyString; watchEntity, unwatchEntity, isEntityWatched API; deriveWatchedEntityRow in navigationItems.svelte.ts with typed and legacy id handling; DEFAULT_WATCHED_ENTITIES in default-watched-entities.ts (Network, Coin, Actor typed ids); WatchButton uses entityType, entityId, entityKey for comparison; EntityView passes entityId from entityIdProp ?? entity?.$id to WatchButton when non-null; networks/+page entityId={{ chainId }}; coins/+page WatchButton entityId with $network, address, interopAddress. Deno test 55 passed; Vitest phase pre-existing failure (npm:@tanstack/svelte-db).
