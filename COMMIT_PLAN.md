# Atomic commit plan

## Phases (topological order)

### Phase 1: Asset system (spec 052)
- **Commit 1:** Add asset schema, lib resolver, SVGs, sync script; remove fetch scripts
- New: `src/constants/assets.ts`, `src/lib/assets/urls.ts`, `src/lib/assets/{chains,coins,providers}/`, `static/icons/coins/*.svg`, `static/icons/providers/*.svg`, `scripts/_sync-assets.ts`
- Deleted: `scripts/_fetch-chain-icons.ts`, `scripts/_fetch-icons.ts`

### Phase 2: Constants — remove old icons, wire to assets
- **Commit 2:** Delete `src/constants/icons.ts`, `src/constants/chain-icon-fetch-items.ts`; update `networks.ts`, `coins.ts`, `bridge-limits.ts`, `stork.ts`, `yellow.ts`, `proxy.ts`, `rpc-endpoints.ts`, `identity-resolver.ts`

### Phase 3: App consumers (layout, views, components, routes)
- **Commit 3:** All files using getAssetUrl/chainAssetUrl/coinAssetUrl or config.icon: `+layout.svelte`, views/*, components/*, routes/* (all touched by icon/asset refactor)

### Phase 4: API and collections
- **Commit 4:** `src/api/*`, `src/collections/*`

### Phase 5: e2e and Playwright
- **Commit 5:** `e2e/*.ts`, `playwright.config.ts`, `playwright.e2e.config.ts`, `src/lib/e2e/tevm.ts`

### Phase 6: Specs
- **Commit 6:** `specs/*.md`

### Phase 7: Config and tooling
- **Commit 7:** `deno.json`, `deno.lock`, `package.json`, `.env.example`, `env.d.ts`, `scripts/check-bundle-size.mjs`, `scripts/check-performance.mjs`, `scripts/_yellow-demo.ts`, `partykit/room.ts`

---

## Commit later / ignore
- Untracked: `history/`, `.specify/memory/*.md`, `playwright.no-server.config.ts`, `src/view/`

---

## Completed (SHAs)
- e6315bf spec 052: add asset schema, lib resolver, chain/coin/provider SVGs, sync script; remove fetch scripts
- 138f9a8 spec 052: remove icons/chain-icon-fetch constants; wire networks, coins, bridge-limits, stork, yellow, proxy, rpc, identity-resolver to assets
- 0a407fa spec 052: switch layout, views, components, routes to asset URLs (getAssetUrl, coinAssetUrl)
- fef0ef8 api + collections: lifi, cctp, yellow, voltaire, uniswap, identity-resolve, simulate, transfers-indexer, approval; blocks, bridge-routes, uniswap-pools, uniswap-positions, swap-quotes-normalize
- 40b537b e2e: update tests, coverage, fixtures, tevm; playwright config
- 96080f3 specs: update 030, 035, 045, 052, 056, 074
- 8b23da3 config: deno, package, env, env.d, check scripts, partykit
- cd93a58 lib: wallet.ts update
