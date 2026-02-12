# Spec 091: Navigation items module – single source and hook

All sidebar navigation data logic lives in `src/routes/navigationItems.svelte.ts`. The root layout does not run nav-specific queries or derivations; it calls a single hook and passes the result to `<Navigation>`.

## Scope

- **Module:** `src/routes/navigationItems.svelte.ts`
  - **Pure:** `getNavigationItems(input: NavigationItemsInput): NavigationItem[]` – builds the full nav tree from a single input object (query results, defaultDashboardId, coinIcons, isTestnet).
  - **Hook:** `useNavigationItems(options: { isTestnet: () => boolean }): NavigationItem[]` – runs all live queries (rooms, sessions, agentChatTrees, watchedEntities, recentTransactions, wallets, walletConnections, verifications, roomPeers, myPeerIds, dashboards, defaultDashboardRow), runs `$effect(ensureDefaultRow)`, calls `registerGlobalLiveQueryStack` with the same query list, and returns `$derived(getNavigationItems({ ... }))` so the layout gets a single reactive array.
- **Layout:** `+layout.svelte` only:
  - Calls `const navigationItems = useNavigationItems({ isTestnet: () => networkEnvironmentState.current === NetworkEnvironment.Testnet })`.
  - Passes `{ navigationItems }` to `<Navigation>` (which passes `items={navigationItems}` to `<NavigationItems>`).
- **Watched entities:** Raw rows from `watchedEntitiesCollection` are mapped through `deriveWatchedEntityRow` (from `WatchedEntities.ts`) before being passed into `getNavigationItems`, so nav sees full `WatchedEntityRow` (id, label, href) while storage keeps only entityType + entityId (spec 084).

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
- [x] Watched-entity rows are derived via `deriveWatchedEntityRow` before `getNavigationItems`.

## Status

Done. Navigation logic and derivations centralized in `navigationItems.svelte.ts`; layout simplified.
