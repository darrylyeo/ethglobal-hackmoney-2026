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
- Files: `src/routes/wallets/+page.svelte`, `src/routes/wallets/WalletsManager.svelte`
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

## Phase 10: Tooling, deps, and dev scripts

DONE (cc119c7): `Tooling: update Deno tasks and deps`
- Files: `.cursor/mcp.json`, `.gemini/settings.json`, `.mcp.json`, `.vscode/mcp.json`, `README.md`, `opencode.json`, `package.json`, `bun.lock`, `deno.json`, `deno.lock`, `scripts/check-bundle-size.mjs`, `scripts/check-performance.mjs`, `scripts/ralph-loop-codex.sh`, `scripts/atomic-commits.md`
- Dependency: none

## Phase 11: Icons pipeline and assets

DONE (439cdc1): `Icons: add fetch pipeline and assets`
- Files: `scripts/_fetch-chain-icons.ts`, `scripts/_fetch-icons.ts`, `src/constants/chain-icon-fetch-items.ts`, `src/constants/icons.ts`, `src/constants/networks.ts`, `static/icons/**`
- Dependency: Phase 10

## Phase 12: Graph + entity type refresh

DONE (7cb0b50): `Graph: expand scene and entity grouping`
- Files: `src/constants/entity-types.ts`, `src/data/$EntityType.ts`, `src/constants/query-limits.ts`, `src/components/G6GraphView.svelte`, `src/routes/GraphScene.svelte`, `src/routes/about/+page.svelte`, `src/routes/about/ArchitectureGraph.svelte`, `src/routes/about/architecture-graph.ts`, `src/routes/about-old/**`, `src/routes/about-old-2/**`
- Dependency: Phase 10

## Phase 13: Dashboard intent drag preview

DONE (49c401d): `Dashboard: refine intent drag preview`
- Files: `src/components/DragArrow.svelte`, `src/components/IntentDragPreview.svelte`, `src/collections/dashboard-panels.ts`, `src/routes/dashboard/+page.svelte`, `src/routes/dashboard/PanelTree.svelte`, `src/routes/dashboard/PanelView.svelte`, `src/routes/dashboard/RouteRenderer.svelte`, `src/routes/dashboard/panel-tree.ts`, `src/routes/dashboard/route-map.ts`
- Dependency: Phase 10

## Phase 14: Wallet UI and input components

DONE (d9aeb5d): `Wallets: refresh manager flow and inputs`
- Files: `src/routes/wallets/+page.svelte`, `src/routes/wallets/WalletsManager.svelte`, `src/views/Wallets.svelte`, `src/views/Balances.svelte`, `src/views/AddressInput.svelte`, `src/views/NetworkInput.svelte`, `src/views/CoinAmountInput.svelte`, `src/views/CoinInput.svelte`, `src/views/TokenAmountInput.svelte`, `src/views/Navigation.svelte`, `src/views/NavigationItem.svelte`, `src/components/Combobox.svelte`, `src/components/Dropdown.svelte`, `src/components/Select.svelte`, `src/components/Skeleton.svelte`, `src/components/Spinner.svelte`, `src/components/Toast.svelte`, `src/state/wallet.svelte.ts`, `src/collections/wallet-connections.ts`, `src/lib/wallet.ts`, `src/styles/accessibility.css`, `src/styles/components.css`, `src/svelte/useContext.ts`
- Files (delete): `src/routes/wallets/WalletManager.svelte`
- Dependency: Phase 11

## Phase 15: Transaction flows and sessions

DONE (f0e4c10): `Flow: update transaction sessions and routes`
- Files: `src/lib/transaction-sessions.ts`, `src/lib/transaction-session-params.ts`, `src/routes/session/+page.svelte`, `src/routes/session/[id]/+page.svelte`, `src/views/TransactionFlow.svelte`, `src/routes/+layout.svelte`, `src/routes/+page.svelte`, `src/routes/bridge/**`, `src/routes/swap/**`, `src/routes/transfers/**`, `src/routes/liquidity/LiquidityFlow.svelte`, `src/routes/rooms/TransferRequests.svelte`, `src/routes/test/intents/+page.svelte`, `src/api/lifi.ts`, `src/api/uniswap.ts`, `src/api/transfers-indexer.ts`, `src/api/transfers-logs.ts`, `src/collections/token-list-coins.ts`
- Dependency: Phase 10

## Phase 16: E2E test hardening + tevm

DONE (5fcb8ac): `e2e: add tevm execution coverage`
- Files: `.env.example`, `e2e/**`, `playwright.config.ts`, `playwright.e2e.config.ts`
- Dependency: Phase 15

## Phase 16b: E2E tevm runtime config

DONE (84f03e1): `e2e: add tevm runtime config`
- Files: `src/lib/e2e/tevm.ts`, `src/lib/e2e/tevm-config.ts`, `src/constants/rpc-endpoints.ts`
- Dependency: Phase 16

## Phase 17: Specs and history updates

DONE (b3b4e55): `Specs: refresh docs and history`
- Files: `specs/*.md`, `history/*.md`
- Files (delete): `specs/023-responsive-design.md`
- Dependency: Phase 10

## Commit later

- None

## Uncommitted working tree files

- None
