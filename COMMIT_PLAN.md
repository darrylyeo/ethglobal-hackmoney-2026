# Commit Plan

## Phase 1: Tooling + type reset

DONE (e9b382f): `Deno runtime: add ts-reset and uqr`
- Files: `deno.json`, `deno.lock`, `package.json`, `reset.d.ts`, `src/Object.d.ts`
- Files (delete): `pnpm-lock.yaml`
- Dependency: none

## Phase 2: Schema constants alignment

DONE (77291ce): `Constants: align schema exports`
- Files: `src/constants/bridge-limits.ts`, `src/constants/coins.ts`, `src/constants/media.ts`, `src/constants/networks.ts`, `src/constants/peer-display-names.ts`, `src/constants/rpc-endpoints.ts`, `src/constants/slippage.ts`, `src/constants/stork.ts`, `src/constants/token-lists.ts`, `src/constants/tokens.ts`, `src/constants/uniswap.ts`, `src/constants/yellow.ts`
- Files (delete): `src/constants/yellow/clearnode.ts`, `src/constants/yellow/custody.ts`, `src/constants/yellow/limits.ts`, `src/constants/yellow/resources.ts`, `src/schema/constants/bridge-limits.ts`, `src/schema/constants/coins.ts`, `src/schema/constants/entity-types.ts`, `src/schema/constants/media.ts`, `src/schema/constants/networks.ts`, `src/schema/constants/peer-display-names.ts`, `src/schema/constants/rpc-endpoints.ts`, `src/schema/constants/slippage.ts`, `src/schema/constants/stork.ts`, `src/schema/constants/token-lists.ts`, `src/schema/constants/tokens.ts`, `src/schema/constants/uniswap.ts`, `src/schema/constants/yellow/resources.ts`
- Files: `src/data/$EntityType.ts`, `src/data/Actor.ts`, `src/data/ActorAllowance.ts`, `src/data/ActorCoin.ts`, `src/data/Coin.ts`, `src/data/Network.ts`, `src/data/StorkPrice.ts`, `src/data/TokenListCoin.ts`, `src/data/WalletConnection.ts`
- Files: `src/collections/actor-coins.ts`, `src/collections/stork-prices.ts`, `src/collections/token-list-coins.ts`, `src/collections/transfer-graphs.ts`
- Files: `src/api/transfers-logs.ts`, `src/api/yellow.ts`, `src/lib/stork.ts`
- Dependency: Phase 1

## Phase 3: Graph + UI primitives

DONE (d6883d8): `Graph: refresh scene and sigma view`
- Files: `src/routes/GraphScene.svelte`, `src/components/SigmaGraphView.svelte`
- Dependency: Phase 2

DONE (66cc716): `Components: add Dropdown and Tooltip`
- Files: `src/components/Dropdown.svelte`, `src/components/Tooltip.svelte`
- Dependency: Phase 1

DONE (c20e479): `Styles: refine bits-ui component states`
- Files: `src/styles/bits-ui.css`
- Dependency: Phase 3

## Phase 4: About architecture graph move

DONE (689d5cd): `About: move architecture graph into route`
- Files: `src/routes/about/+page.svelte`, `src/routes/about/ArchitectureGraph.svelte`, `src/routes/about/architecture-graph.ts`
- Files (delete): `src/lib/architecture-graph.ts`, `src/routes/architecture/+page.svelte`, `src/routes/architecture/ArchitectureGraph.svelte`
- Dependency: Phase 1

## Phase 5: Rooms + PartyKit

DONE (9d5de54): `Rooms: add display-name encoding and QR`
- Files: `src/lib/room.ts`, `src/constants/room-display-names.ts`, `src/state/room.svelte.ts`
- Files: `src/routes/rooms/+page.svelte`, `src/routes/rooms/Peer.svelte`, `src/routes/rooms/SharedAddresses.svelte`, `src/routes/rooms/[roomId]/+page.svelte`, `src/routes/rooms/[roomId]/channels/+page.svelte`
- Files (delete): `src/lib/partykit.ts`
- Dependency: Phase 1, Phase 2

## Phase 6: Wallets UI + route

DONE (dece40a): `Wallets: add manager route and view updates`
- Files: `src/routes/wallets/+page.svelte`, `src/routes/wallets/WalletManager.svelte`
- Files: `src/views/Wallets.svelte`, `src/views/Balances.svelte`, `src/views/NetworkInput.svelte`, `src/views/NavigationItem.svelte`, `src/views/StorkPriceFeed.svelte`
- Dependency: Phase 2

## Phase 7: Dashboard panels

DONE (aa980b0): `Dashboard: add panel tree state and routes`
- Files: `src/data/DashboardPanel.ts`, `src/collections/dashboard-panels.ts`
- Files: `src/routes/dashboard/+page.svelte`, `src/routes/dashboard/PanelTree.svelte`, `src/routes/dashboard/PanelView.svelte`, `src/routes/dashboard/RouteRenderer.svelte`, `src/routes/dashboard/panel-tree.ts`, `src/routes/dashboard/route-map.ts`
- Dependency: Phase 2

## Phase 8: Layout, navigation, and tests

DONE (3a73bcb): `Layout: align main landmark and selectors`
- Files: `src/routes/+layout.svelte`, `src/routes/bridge/+page.svelte`, `src/routes/bridge/UnifiedBridgeFlow.svelte`, `src/routes/bridge/UnifiedProtocolRouter.svelte`, `src/routes/bridge/cctp/+page.svelte`, `src/routes/bridge/lifi/+page.svelte`, `src/routes/bridge/lifi/BridgeFlow.svelte`, `src/routes/liquidity/+page.svelte`, `src/routes/liquidity/LiquidityFlow.svelte`, `src/routes/swap/+page.svelte`, `src/routes/swap/SwapFlow.svelte`, `src/routes/transfers/+page.svelte`, `src/routes/transfers/TransferFlow.svelte`, `src/routes/test/chain-id/+page.svelte`, `src/routes/test/collections/+page.svelte`, `src/routes/test/intents/+page.svelte`, `src/routes/test/networks-coins/+page.svelte`
- Files: `e2e/accessibility.test.ts`, `e2e/bridge-e2e.test.ts`, `e2e/bridge.test.ts`, `e2e/cctp-bridge.test.ts`, `e2e/responsive.test.ts`, `e2e/route-coverage.test.ts`, `e2e/unified-bridge.test.ts`, `e2e/wallet.test.ts`, `src/routes/bridge/lifi/bridge.test.ts`, `src/routes/bridge/lifi/page.test.ts`, `src/routes/bridge/lifi/responsive.test.ts`, `src/routes/bridge/lifi/wallet.test.ts`
- Files: `history/2026-01-31-spec-014-e2e-blocked.md`, `history/2026-01-31-spec-014-still-blocked.md`, `history/2026-01-31-spec-014-unblock-partial.md`, `history/2026-02-02-build-reverify-030-e2e-blocked.md`, `specs/022-accessibility.md`, `specs/039-e2e-test-hardening.md`
- Dependency: Phase 5

## Phase 9: Specs tracking

DONE (a4178cc): `Specs: add new spec docs`
- Files: `specs/043-deno-runtime.md`, `specs/045-schema-constants-preferences.md`, `specs/046-transaction-sessions.md`, `specs/047-intent-drag-tooltip-previews.md`, `specs/048-g6-graph-intents-and-schema.md`
- Dependency: Phase 1

## Commit later

- None

## Uncommitted working tree files

- None
