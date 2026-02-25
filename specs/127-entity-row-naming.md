# Spec 127: Entity and query result naming

Use semantic names instead of generic "row" / "entry" for variables and parameters when the type is clear. Prefer `entityKey(entityType, entity)` and avoid redundant id parts when the full entity is passed.

## Conventions

### Variables and callbacks

- **Drop "Rows" suffix** for list variables: use plain plurals (e.g. `watchedActors`, `watchedEvmSelectors`, `proposalViews`, `routeEntries`) unless the term is domain-specific (e.g. CCTP fee `.rows` array).
- **Loop and callback parameters:** Use semantic names (e.g. `wallet`, `session`, `actor`, `pool`, `position`, `quote`, `connection`) instead of `row` or `r`. For TanStack query results that have shape `{ row: T }`, destructure with a semantic alias: `.map(({ row: wallet }) => [wallet.$id.rdns, wallet])` or `.map(({ row: session }) => session)`.
- **Views:** Prefer a single prop named after the entity (e.g. `pool: UniswapPool`, `position: UniswapPosition`, `entity` when generic) rather than `entry` when the view receives one entity.

### Collections

- **getKey:** Prefer a semantic parameter name when it improves clarity (e.g. `getKey: (item: WatchedEntityStored) => ...`, `getKey: (route: BridgeRoutesRow) => ...`, `getKey: (wallet: WalletRow) => ...`). The TanStack query API still uses the alias `row` in `.from({ row: collection }).select(({ row }) => ...)`; that shape is fixed by the library.
- **insert / update callbacks:** Prefer semantic names for the inserted/updated value (e.g. `wallet`, `session`, `cast`) where the type is obvious.

### Identity

- Use **`entityKey(entityType, entity)`** (or the overload that takes `entityId`) for stable keys. Do not pass id parts or `$id` separately when the full entity is already available.

## Out of scope

- Renaming the TanStack query callback parameter `row` in `.where(({ row }) => ...)` (library contract).
- Type names (e.g. `*Row`, `*Entry`) unless a type is a simple alias and renaming is unambiguous.
- ItemsList internal names `itemRows`, `placeholderRows`, `allRows` (list-display semantics; `items` is already the prop name).

## Status

Applied across navigationItems, GraphScene, collections, views, routes, and state modules. Optional follow-up: standardize remaining collection `getKey(row)` parameters to semantic names in batches.
