# Spec 065: External API cache and live-query-only reads

All external API fetch queries must be cached (upserted) in TanStack DB and
consumed only via TanStack DB live queries. Normalization happens at the
collection boundary. Loading state is not implemented manually in Svelte.

## References

- [TanStack DB – Overview](https://tanstack.com/db/latest/docs/overview): normalized collections, live queries, query-driven sync
- [TanStack DB – Live Queries](https://tanstack.com/db/latest/docs/guides/live-queries): live query collections, reactive results
- [TanStack DB – Query Collection](https://tanstack.com/db/latest/docs/collections/query-collection): `queryCollectionOptions`, `queryFn` → sync store, `writeUpsert` / full-state sync
- [TanStack DB – Svelte](https://tanstack.com/db/latest/docs/framework/svelte/overview): `useLiveQuery`, reactive `query.data` / `query.isLoading`
- Spec 002 (TanStack DB collections), Spec 017 (loading states), Spec 042 (entity data sources)

## Definitions

- **External API fetch**: Any request that retrieves data from outside the app (HTTP REST, JSON-RPC, WebSocket, LI.FI, Stork, CCTP, Voltaire, etc.). Excludes: reading from localStorage, in-memory constants, EIP-6963 wallet discovery.
- **Collection boundary**: The module that defines the TanStack DB collection and its sync/fetch logic (e.g. `queryFn`, or code that calls `collection.insert` / `collection.update` / `collection.utils.writeUpsert`).

## Rules

### 1. Cache (upsert) in TanStack DB

- Every external API fetch that provides data used in the UI or in route logic must write that data into a TanStack DB collection.
- Writes must be upsert-style at the collection boundary: either via a Query Collection’s `queryFn` (which syncs full or incremental state) or via explicit `insert` / `update` / `utils.writeUpsert` (or `writeBatch`) after fetching.
- The collection must have a stable `getKey` (or equivalent) so that repeated fetches update existing rows instead of duplicating.

### 2. Normalization at the collection boundary

- Normalization (shape, `$source`, ids, defaults, parsing) must be done in the collection module before or as part of writing into the collection.
- Components and views must not normalize API responses; they only consume already-normalized data from live queries.

### 3. Read only via live queries

- UI and route logic must read cached external data only through TanStack DB live queries:
  - Svelte: `useLiveQuery(...)` (or equivalent Svelte adapter API).
  - Optionally, shared derived collections built with `createLiveQueryCollection` / `liveQueryCollectionOptions` that are then used via `useLiveQuery` or equivalent.
- Direct reads of external data from `collection.state.get(...)` inside Svelte components or route code are forbidden for that data. (Internal use inside the same collection module for implementing fetch/upsert logic is allowed.)
- No component or page may call `fetch()` (or equivalent) and then use the result for rendering or business logic without that result first being written into a collection and then read via a live query.

### 4. No manual loading state in Svelte

- Loading and error state for externally fetched data must not be implemented with manual Svelte state (e.g. `$state()` or component-owned `isLoading` / `error` variables) that mirror the same concept.
- Components must derive loading/error from:
  - The live query result (e.g. `query.isLoading`, `query.status`, `query.error` from `useLiveQuery`), or
  - `<svelte:boundary>` (and optionally error/loading boundaries) that rely on the same query/collection lifecycle.
- Spec 017 (Skeleton/Spinner/LoadingButton) remains valid for *presentation* of loading; the *source of truth* for “is this data loading?” must be the TanStack DB / live query layer, not a separate Svelte state variable.

## Implementation notes

- **Query collections**: Prefer `queryCollectionOptions` with a `queryFn` that fetches and returns an array of items; the collection syncs that into the store. Use normalizers inside `queryFn` (or a wrapper) so stored rows are normalized before sync.
- **Other collections (e.g. localStorage-backed)**: When the source is an external API, the module that performs the fetch must call `collection.insert` / `update` / `utils.writeUpsert` with normalized rows; subscription or polling logic stays inside the collection module.
- **Incremental / partial fetches**: Use `collection.utils.writeUpsert` or `writeBatch` to merge into the synced store without replacing the whole collection, and ensure `getKey` is consistent so live queries see updated rows.

## Acceptance criteria

- [x] Every external API that provides data to the UI or routes is documented (or listed in a single place) and each has a corresponding TanStack DB collection that receives the fetched data via upsert/sync.
- [x] All such collections perform normalization (including `$source` where applicable) at the collection boundary (in the same module as the collection or its `queryFn`/fetch logic).
- [x] No Svelte component or route file calls `fetch()` (or equivalent external request) and uses the response for rendering or business logic without first writing it into a collection and reading via a live query.
- [x] No Svelte component or route file reads externally-sourced collection data via `collection.state.get(...)` for display or flow control; only via `useLiveQuery` (or equivalent) or derived live-query collections.
- [x] No component or page introduces or uses a manual `$state()` (or equivalent) that represents “loading” or “error” for the same data that a TanStack DB live query already provides; loading/error are taken from the live query (or boundary) only.
- [x] Unit or integration tests (or a short audit script) verify that: (a) no route/component imports and calls external fetch APIs directly for data that is then rendered, and (b) collection modules that own external fetches normalize and upsert into their collection.

## External APIs and collections (reference)

Every external API that provides data to the UI or routes must be cached in a TanStack DB collection and read only via live queries. Normalization happens at the collection boundary.

| External API / source              | Collection module                                | Sync / fetch                                      |
| ---------------------------------- | ------------------------------------------------ | ------------------------------------------------- |
| Voltaire (eth\_\*, RPC)            | `blocks.ts`                                      | `fetchBlock` → upsert                             |
| Voltaire (eth\_\*, RPC)            | `actor-coins.ts`                                 | `fetchActorCoinBalance` → upsert                  |
| Voltaire (eth\_\*, RPC)            | `actor-allowances.ts`                            | fetch → upsert                                    |
| Voltaire (eth\_\*, RPC)            | `NetworkTransactions.ts`                        | fetch → upsert                                    |
| Voltaire (eth\_\*, RPC)            | `transfer-events.ts`                             | `fetchTransferEvents` → upsert                    |
| (derived from transfer-events)     | `transfer-graphs.ts`                             | `upsertGraphFromEvents` (from cache after fetch)  |
| Stork (REST / WebSocket / RPC)     | `stork-prices.ts`                                | `subscribeStorkPrices` → upsert                   |
| LI.FI (getQuote, routes)           | `bridge-routes.ts`                               | queryFn / fetch → upsert                          |
| CCTP (REST)                        | `cctp-fees.ts`                                   | fetch → upsert                                    |
| CCTP (REST)                        | `cctp-allowance.ts`                              | fetch → upsert                                    |
| Token list URLs                    | `token-list-coins.ts`                            | fetch → upsert                                    |
| spanDEX (getQuotes / getQuote)     | `SpandexQuoteItems.ts`                           | `fetchSpandexQuotes` (all; optional strategy sorts by bestPrice/fastest/estimatedGas) / `fetchSpandexQuoteForProvider` → upsert |
| spanDEX (best quote → swap quote)  | `swap-quotes.ts`                                 | `fetchSpandexSwapQuote(strategy?)` → upsert (strategy from protocol tag) |
| Uniswap (quote)                    | `swap-quotes.ts`                                 | `fetchSwapQuote` → upsert                         |
| Transfers indexer / logs           | `transfer-events.ts`                             | `fetchTransferEventsForPeriod` (api) → collection |
| Identity (RPC / resolver)          | `IdentityLinks.ts`                               | fetch → upsert                                    |
| Voltaire (ENS reverse + forward)   | `evm-actor-profiles.ts`                          | `fetchEvmActorProfile` → upsert                   |
| Networks (constant + optional RPC) | `networks.ts`                                    | queryFn / constant                                |
| PartyKit (rooms, peers, etc.)      | `PartykitRooms.ts`, `PartykitRoomPeers.ts`, etc. | subscription → upsert                             |
| Yellow / EIP-7824 (state channels) | `StateChannels.ts`, `StateChannelStates.ts`, `StateChannelDeposits.ts`, `StateChannelTransfers.ts` | subscription / fetch → upsert                     |

Fetch and subscription logic lives in the collection module (or an api module called only from the collection). Components and routes use `useLiveQuery` (or derived live-query collections) only.

## Status

Complete. Routes and components no longer use `collection.state.get` or `getSession`; fetch/flow control moved to collection helpers (`ensureBlocksForPlaceholders`, `ensureTransferEventsForPlaceholders`) and session lookup via `useLiveQuery` + `lookupSessionId` pattern.

## Output when complete

`DONE`
