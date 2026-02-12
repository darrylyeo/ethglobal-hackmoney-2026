# Spec 093: Watched entities – store entityType and entityId: EntityId directly

Watched entities (manual pins in the nav, spec 084) persist `entityType` and **typed** `entityId: EntityId` instead of a string. This aligns with the entity `$id` convention (spec 092) and keeps one source of truth for identity.

## Stored shape

- **`WatchedEntityStoredRow`**: `{ entityType: EntityType, entityId: EntityId, addedAt: number }`.
- **Key**: `entityType` + stable serialization of `entityId`, via `watchedEntityKey({ entityType, entityId })`. Implemented as `${entityType}:${stringify(entityId)}` for object ids, or `${entityType}:${entityId}` when `entityId` is a legacy string.
- **`EntityId`**: Union of all `EntityId<EntityType>` from `$/data/$EntityType.ts` (e.g. `Network$Id`, `Coin$Id`, `Contract$Id`, `ActorCoin$Id`).

## API

- **`watchEntity({ entityType, entityId })`** – insert/update by key; `entityId` is the typed object.
- **`unwatchEntity(entityType, entityId)`** – delete by `watchedEntityKey({ entityType, entityId })`.
- **`isEntityWatched(entityType, entityId)`** – has key.
- **`watchedEntityKey(row)`** – exported so callers can build the same key (e.g. WatchButton for “is this entity watched?”).

## Derivation (label / href)

`deriveWatchedEntityRow(stored)` produces `WatchedEntityRow` (adds `id`, `label`, `href`):

- **Typed `entityId`**: Switch on `entityType` and use the id shape. Examples:
  - **Coin**: label from `interopAddress` or token lookup; href `/coin/${symbol}`.
  - **Network**: label/name from `networkConfigsByChainId[entityId.chainId]`; href `/network/${slugForChainId(entityId.chainId)}`.
  - **Contract**: href `/network/${slug}/contract/${entityId.address}` using `slugForChainId(entityId.$network.chainId)`.
- **Legacy string `entityId`** (or legacy `id`): Still supported. Derivation infers label/href from the string (e.g. slug for Network, symbol for Coin, `slug:address` for Contract) and, where possible, reconstructs a best-effort `EntityId` for the returned row.

## Default watched entities

`DEFAULT_WATCHED_ENTITIES` uses typed ids only:

- **Coin (ETH)**: `{ $network: { chainId: ChainId.Ethereum }, address: zero, interopAddress: 'ETH' }`.
- **Coin (USDC)**: first Ethereum USDC entry from `ercTokens`, as `Coin$Id`.
- **Network (Ethereum)**: `{ chainId: ChainId.Ethereum }`.

## Call sites

- **WatchButton**: Props are `entityType` and `entityId: EntityId`. No string `id`. “Is watched?” is computed by comparing `watchedEntityKey({ entityType, entityId })` to keys of stored rows.
- **EntityView**: Renders WatchButton only when `entityId != null`, with `entityId` derived from `entity?.$id`.
- **networks/+page.svelte**: Passes `entityId={{ chainId: config.chainId }}`.
- **coins/+page.svelte**: Passes `entityId={{ $network: { chainId: coin.chainId }, address: coin.address, interopAddress: coin.symbol }}`.

## Backward compatibility

Existing localStorage rows that used string `entityId` (e.g. `"ethereum"`, `"USDC"`) remain valid: `deriveWatchedEntityRow` treats them as legacy and produces the same label/href. New watches are stored with the typed `entityId` object.

## Status

Implemented. Watched entities store and compare by typed `EntityId`; legacy string ids are handled in derivation only.
