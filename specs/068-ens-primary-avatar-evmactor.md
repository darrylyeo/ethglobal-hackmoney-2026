# Spec 068: ENS primary name / avatar resolution and EvmActor display

Resolve and reverse-resolve primary ENS names and avatars for EVM addresses, cache them in TanStack DB, and display accounts as `<EvmActor>` (avatar + address + optional ENS name in parentheses).

## Scope

- Schema and TanStack DB collection for per-address ENS profile data (primary name, avatar URL), keyed by chain + address, with fetch-upsert from Voltaire.
- `<EvmActor>` component: shows avatar (`<Icon>`), `<Address>`, and `(<EnsName>)` in parentheses when resolved.
- Resolution uses existing identity-resolve API (forward/reverse ENS via Voltaire); avatar from primary name text record.

## Non-goals

- Supporting non-ENS name systems.
- Editing or setting ENS records.
- Multiple names or custom text records in the UI beyond primary name and avatar.

## Definitions

- **Primary ENS name**: Reverse-record name for an address (e.g. `vitalik.eth`).
- **ENS avatar**: `avatar` text record of the primary name (or the address’s resolved primary name), used as profile image.

## Data model

### Schema (constants)

```typescript
// EvmActor / ENS profile row: one per (chainId, address)
type EvmActorProfile$Id = {
  chainId: ChainId
  address: `0x${string}`  // normalized lowercase
}

type EvmActorProfile = {
  $id: EvmActorProfile$Id
  primaryName?: string   // reverse-resolved ENS name
  avatarUrl?: string      // from primary name's avatar text record
  $source: DataSource
}
```

### Collection

- **id**: `evm-actor-profiles`
- **getKey**: `(row) => `${row.$id.chainId}:${row.$id.address.toLowerCase()}``
- **Fetch-upsert**: For a given `(chainId, address)`:
  1. Reverse-resolve address → primary name (existing `resolveEnsReverse`).
  2. If primary name exists, forward-resolve name → avatar text record (existing `resolveEnsForward` with `['avatar']`).
  3. Upsert one row: `{ $id, primaryName?, avatarUrl?, $source: Voltaire }`.
- Resolution runs only on chains that have an ENS resolver config (e.g. Ethereum mainnet). Caller or collection triggers fetch when a profile is needed (e.g. `ensureEvmActorProfile(chainId, address)`).
- Loading/error: same pattern as other fetch-upsert collections (e.g. blocks): optional `isLoading` / `error` on the row or derived from query; no separate Svelte loading state for this data (Spec 065).

## Component: EvmActor

- **Props**: `network: Network$Id`, `address: \`0x${string}\``, optional `profile` (primaryName, avatarUrl) or rely on live query from collection.
- **Layout**: Avatar (left) + Address (middle) + if `primaryName` then ` (primaryName)` in parentheses. Use `<Icon>` for avatar (src = avatarUrl, or fallback: no image / placeholder). Use existing `<Address>` for the address segment (with optional `ensName` for tooltip/copy if desired; spec requires display of address + parens name).
- **Data**: Prefer passing resolved `primaryName` / `avatarUrl` from a parent that subscribes to the collection via `useLiveQuery` and calls `ensureEvmActorProfile(chainId, address)` so the row is fetched/upserted. Component can accept either pre-resolved props or address-only and subscribe internally.

## Acceptance criteria

### Schema and constants

- [x] `EvmActorProfile$Id` and `EvmActorProfile` types exist (e.g. in `src/constants/` or `src/data/`).
- [x] Types include `$id`, `primaryName?`, `avatarUrl?`, `$source`.

### TanStack DB collection

- [x] `evm-actor-profiles` collection exists with `getKey` = `chainId:address` (lowercase).
- [x] Fetch-upsert helper (e.g. `ensureEvmActorProfile(chainId, address)`) uses Voltaire: reverse resolve → primary name, then forward resolve primary name for `avatar` text record; writes one normalized row per (chainId, address).
- [x] Normalization (including `$source`) at collection boundary. No component fetches ENS data directly; all reads via live query.

### EvmActor component

- [x] `<EvmActor>` shows: avatar (`<Icon>`) + `<Address>` + `(<EnsName>)` when primary name is resolved.
- [x] Uses existing `<Icon>` and `<Address>`; ENS name in parentheses only when present.
- [x] Component receives `network` and `address`; profile data (primaryName, avatarUrl) comes from collection (parent passes from live query or component subscribes and triggers ensure).

### Integration

- [x] At least one route or view uses `<EvmActor>` with data from the new collection (e.g. account page, transfer list, or peers).

## References

- Spec 055 (identity input + resolver): existing `resolveEnsForward`, `resolveEnsReverse`, identity resolvers.
- Spec 065 (external API cache): fetch-upsert in collection, read only via live query.
- Spec 002 (TanStack DB collections), blocks collection (ensure + fetch pattern).

## Output when complete

`DONE`
