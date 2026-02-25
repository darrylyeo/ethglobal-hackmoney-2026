# Spec 091: Navigation items module – single source and hook

All sidebar navigation data logic lives in `src/routes/navigationItems.svelte.ts`. The root layout does not run nav-specific queries or derivations; it calls a single hook and passes the result to `<Navigation>`.

## Scope

- **Module:** `src/routes/navigationItems.svelte.ts`
  - **Pure:** `getNavigationItems(input: NavigationItemsInput): NavigationItem[]` – builds the full nav tree from a single input object (query results, defaultDashboardId, coinIcons, isTestnet).
  - **Hook:** `useNavigationItems(options: { isTestnet: () => boolean }): NavigationItem[]` – runs all live queries (rooms, sessions, agentChatTrees, watchedEntities, recentTransactions, wallets, walletConnections, verifications, roomPeers, myPeerIds, dashboards, defaultDashboardRowQuery), runs `$effect(ensureDefaultRow)`, calls `registerGlobalLiveQueryStack` with the same query list, and returns `$derived(getNavigationItems({ ... }))` so the layout gets a single reactive array. Derived values use `defaultDashboardId` from the default dashboard row.
- **Layout:** `+layout.svelte` only:
  - Calls `const navigationItems = useNavigationItems({ isTestnet: () => networkEnvironmentState.current === NetworkEnvironment.Testnet })`.
  - Passes `{ navigationItems }` to `<Navigation>` (which passes `items={navigationItems}` to `<NavigationItems>`).
- **Watched entities:** The `watchedEntitiesCollection` is the **sole source** for entity children in nav. Stored items are mapped through `deriveWatchedEntity` before `getNavigationItems`. Sessions, Accounts, Rooms, Agents, Coins, Networks—all derive their children from WatchedEntities. No hardcoded entity lists; defaults come from `DEFAULT_WATCHED_ENTITIES` seeded on profile creation (spec 084, 093). Query result arrays are destructured with semantic names (e.g. `.map(({ row: wallet }) => [wallet.$id.rdns, wallet])`) when building keyed maps (spec 127).

## Output

- A single `NavigationItem[]` with all information needed for `<NavigationItems>` (ids, titles, hrefs, icons, children, allChildren, manualWatch, tags, etc.).
- No duplication of query setup or derivation in the layout.

## Dependencies

- Spec 084 (watched entities stored as entityType + entityId; derivation in WatchedEntities).
- Spec 058 (global live query stack registered inside the hook).

## Acceptance criteria

- [x] All nav live queries run inside `useNavigationItems`.
- [x] `ensureDefaultRow` and `registerGlobalLiveQueryStack` run inside the hook.
- [x] Layout derives navigation with one call: `useNavigationItems({ isTestnet })`.
- [x] Layout passes a single `navigationItems` array to `<Navigation>`.
- [x] Watched-entity items are derived via `deriveWatchedEntity` before `getNavigationItems`.

## Status

Complete. Re-verification 2026-02-21 (PROMPT_build execute one spec): All 5 AC confirmed—nav live queries, ensureDefaultRow, registerGlobalLiveQueryStack inside NavigationItems; layout uses one call `new NavigationItems({ isTestnet })` and passes `nav.items` to `<Navigation>`; watched-entity rows derived via `deriveWatchedEntityRow` before building items in `$derived.by`. Deno test 55 passed; Vitest phase pre-existing failure (npm:@tanstack/svelte-db). Previous: Done. Navigation logic and derivations centralized in `navigationItems.svelte.ts`; layout simplified.
