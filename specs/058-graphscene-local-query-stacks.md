# Spec 058: GraphScene local query stacks

Make `GraphScene` accept local/global TanStack DB query stacks as props and ensure
every page/view that uses live queries registers a local stack for visualization.

## Scope

- `GraphScene` accepts explicit local/global query stacks and defaults to the
  appropriate live query contexts when props are omitted.
- All route pages and views that use `useLiveQuery` register their local query
  entries via `registerLocalLiveQueryStack` so the graph can highlight them.
- **Global stack is the watched entity set** (spec 084): the entities the user
  is currently tracking (wallet-connection accounts, active sessions, recent
  transactions, manually watched entities) are registered via
  `registerGlobalLiveQueryStack` in the layout. This replaces the previous
  hardcoded list of wallet-connections + sessions + wallets.
- Context hooks: `useGlobalQueries()` and `useLocalQueries()` expose the shared
  stacks; layout and GraphScene use them when explicit props are omitted.
- Local-only graph: `LocalGraphScene.svelte` wraps GraphScene with
  `queryStack={useLocalQueries().stack}` and `globalQueryStack={[]}`, used on
  session/+page, account/[address], rooms/[roomId], sessions/+page so those
  pages can show a graph that highlights only their local query data.
- Highlight mapping covers the full set of graph entity nodes using row metadata.

## Global stack composition

The layout builds the global stack from the unified watched entity view
(spec 084). Each watch source maps to one or more query entries:

| Watch source | Query entries |
|---|---|
| `wallet-connection` | Wallet connections query, wallets query |
| `session-active` | Active sessions query |
| `transaction-recent` | Recent transactions query |
| `manual` | Watched entities collection query |

This ensures the graph highlights exactly the entities the user is watching,
and no layout query exists solely for the graph that isn't also used by nav
or other layout consumers.

## Non-goals

- Do not change collection schemas or query semantics.
- Do not add new graph UI beyond stack highlighting and dimension mapping.

## Acceptance criteria

- [x] `GraphScene` distinguishes local vs global query stacks when highlighting.
- [x] Pages/views using `useLiveQuery` register local query entries via
  `registerLocalLiveQueryStack` (shared state, merged where multiple queries exist).
- [ ] Global stack contains queries for all watched entities (spec 084), replacing
  the hardcoded wallet-connections + sessions + wallets.
- [x] `useGlobalQueries` / `useLocalQueries` are the context hooks (no longer
  `useLiveQueryContext` / `useLocalLiveQueryContext`).
- [x] Local-only graph available on key pages via `LocalGraphScene` (no new queries).
- [x] Highlight mapping recognizes query rows across all graph node types.
- [x] Visualization uses domain metadata for richer entity dimension mapping.

## Status

Partially complete. Local/global stack infrastructure, context hooks,
LocalGraphScene, and highlight mapping are done. Global stack composition to be
updated per spec 084 refactor (watched entities as the single source of truth).

## Output when complete

`DONE`
