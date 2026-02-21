# Spec 058: GraphScene local query stacks

Make `GraphScene` accept local/global TanStack DB query stacks as props and ensure
every page/view that uses live queries registers a local stack for visualization.

## Scope

- `GraphScene` accepts explicit local/global query stacks and defaults to the
  appropriate live query contexts when props are omitted.
- All route pages and views that use `useLiveQuery` register their local query
  entries via `registerLocalLiveQueryStack` so the graph can highlight them.
- **Global stack** is registered inside `useNavigationItems` (spec 091) in
  `src/routes/navigationItems.svelte.ts`. It includes wallet-connections,
  sessions, wallets, recent transactions, and watched-entities queries. The
  layout does not call `registerGlobalLiveQueryStack` directly; the hook does.
- Context hooks: `useGlobalQueries()` and `useLocalQueries()` expose the shared
  stacks; layout and GraphScene use them when explicit props are omitted.
- Local-only graph: `LocalGraphScene.svelte` wraps GraphScene with
  `queryStack={useLocalQueries().stack}` and `globalQueryStack={[]}`, used on
  session/+page, account/[address], rooms/[roomId], sessions/+page so those
  pages can show a graph that highlights only their local query data.
- Highlight mapping covers the full set of graph entity nodes using row metadata.

## Global stack composition

The global stack is built inside `useNavigationItems` (spec 091). The hook
registers: wallet-connections, sessions, wallets, recent transactions, watched
entities. The same query data feeds `getNavigationItems`, so nav and graph
share one derivation path.

## Non-goals

- Do not change collection schemas or query semantics.
- Do not add new graph UI beyond stack highlighting and dimension mapping.

## Acceptance criteria

- [x] `GraphScene` distinguishes local vs global query stacks when highlighting.
- [x] Pages/views using `useLiveQuery` register local query entries via
  `registerLocalLiveQueryStack` (shared state, merged where multiple queries exist).
- [x] Global stack contains queries for all watched entities (spec 084), replacing
  the hardcoded wallet-connections + sessions + wallets.
- [x] `useGlobalQueries` / `useLocalQueries` are the context hooks (no longer
  `useLiveQueryContext` / `useLocalLiveQueryContext`).
- [x] Local-only graph available on key pages via `LocalGraphScene` (no new queries).
- [x] Highlight mapping recognizes query rows across all graph node types.
- [x] Visualization uses domain metadata for richer entity dimension mapping.

## Status

Complete. Global stack is driven by watched entity types: Session, SocialPostSession, Actor, Room, AgentChatTree, Contract, and Farcaster (User/Channel/Cast) each add their corresponding collection query when that type is watched. Watched entities and transactions remain always included.

## Output when complete

`DONE`
