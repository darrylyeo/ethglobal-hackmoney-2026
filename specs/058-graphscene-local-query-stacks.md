# Spec 058: GraphScene local query stacks

Make `GraphScene` accept local/global TanStack DB query stacks as props and ensure
every page/view that uses live queries registers a local stack for visualization.

## Scope

- `GraphScene` accepts explicit local/global query stacks and defaults to the
  appropriate live query contexts when props are omitted.
- All route pages and views that use `useLiveQuery` register their local query
  entries via `registerLocalLiveQueryStack` so the graph can highlight them.
- Global stack is selective: only user-driven, high-recency entities (wallet
  connections, sessions, wallets) are registered via `registerGlobalLiveQueryStack`
  in the layout; other layout queries (rooms, verifications, room peers, my peer
  IDs) are not in the global graph stack.
- Context hooks: `useGlobalQueries()` and `useLocalQueries()` expose the shared
  stacks; layout and GraphScene use them when explicit props are omitted.
- Local-only graph: `LocalGraphScene.svelte` wraps GraphScene with
  `queryStack={useLocalQueries().stack}` and `globalQueryStack={[]}`, used on
  session/+page, account/[address], rooms/[roomId], sessions/+page so those
  pages can show a graph that highlights only their local query data.
- Highlight mapping covers the full set of graph entity nodes using row metadata.

## Non-goals

- Do not change collection schemas or query semantics.
- Do not add new graph UI beyond stack highlighting and dimension mapping.

## Acceptance criteria

- [x] `GraphScene` distinguishes local vs global query stacks when highlighting.
- [x] Pages/views using `useLiveQuery` register local query entries via
  `registerLocalLiveQueryStack` (shared state, merged where multiple queries exist).
- [x] Global stack contains only wallet connections, sessions, and wallets.
- [x] `useGlobalQueries` / `useLocalQueries` are the context hooks (no longer
  `useLiveQueryContext` / `useLocalLiveQueryContext`).
- [x] Local-only graph available on key pages via `LocalGraphScene` (no new queries).
- [x] Highlight mapping recognizes query rows across all graph node types.
- [x] Visualization uses domain metadata for richer entity dimension mapping.

## Status

Complete. GraphScene accepts `queryStack` / `globalQueryStack` props and defaults to
`useLocalQueries().stack` / `useGlobalQueries().stack` when omitted; local vs global
are distinguished in Sigma (nodeReducer/edgeReducer) and G6 (highlight vs
globalHighlight state). G6GraphView accepts `globalHighlightedNodes` and applies
dimmed styling. Layout registers global stack via `registerGlobalLiveQueryStack`
with wallet connections, sessions, wallets only. Many pages/views register local
entries via `registerLocalLiveQueryStack`. LocalGraphScene.svelte (toggle + GraphScene
with empty global stack) is used on session/+page, account/[address], rooms/[roomId],
sessions/+page. buildHighlightedNodes maps all graph entity types. Node details and
collection drive dimension mapping.

## Output when complete

`DONE`
