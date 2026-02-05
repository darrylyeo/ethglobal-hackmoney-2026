# Commit Plan

## Phase 1: Dashboard panel routing + intent navigation

DONE (30b9369): `Dashboard: refactor panel routing and intent navigation`
- Files: `src/routes/dashboard/+page.svelte`, `src/routes/dashboard/PanelTree.svelte`, `src/routes/dashboard/Panel.svelte`, `src/routes/dashboard/SvelteKitRoute.svelte`, `src/routes/dashboard/route-map.ts`
- Files: `src/components/IntentDragPreview.svelte`, `src/state/intent-navigation.svelte.ts`, `src/app.d.ts`, `src/routes/about/architecture-graph.ts`
- Files: `src/styles/components.css` (pressable no-scale rules)
- Files (delete): `src/routes/dashboard/PanelView.svelte`, `src/routes/dashboard/RouteRenderer.svelte`, `src/routes/dashboard/panel-tree.ts`
- Dependency: none

## Phase 2: Wallet menu refactor

DONE (5149b92): `Wallets: centralize menu entries`
- Files: `src/views/AccountsSelect.svelte`
- Dependency: Phase 1

## Phase 3: Session actions + flows

DONE (6b8c161): `Session: streamline actions and flows`
- Files: `src/lib/dashboard-panel-hash.ts`, `src/lib/transaction-session-params.ts`, `src/views/Session.svelte`, `src/views/SessionAction.svelte`, `src/views/TransactionFlow.svelte`
- Files: `src/routes/session/+page.svelte`, `src/routes/session/BridgeView.svelte`, `src/routes/session/SwapView.svelte`, `src/routes/session/TransferView.svelte`, `src/routes/session/LiquidityFlow.svelte`, `src/routes/session/SwapFlow.svelte`, `src/routes/session/TransferFlow.svelte`, `src/routes/session/UnifiedBridgeFlow.svelte`, `src/routes/session/SwapAction.svelte`, `src/routes/session/TransferAction.svelte`
- Files: `src/routes/bridge/cctp/CctpBridgeFlow.svelte`, `src/routes/bridge/lifi/BridgeFlow.svelte`, `src/routes/session/BridgeView.svelte`, `src/routes/session/SwapView.svelte`, `src/routes/session/TransferView.svelte`, `src/routes/session/TransferFlow.svelte`
- Files: `src/routes/test/intents/+page.svelte`, `src/styles/components.css` (session action columns)
- Dependency: Phase 1

## Phase 4: E2E selector updates

DONE (ffde7f0): `e2e: align selectors with session UI`
- Files: `e2e/bridge-e2e.test.ts`, `e2e/cctp-bridge.test.ts`, `e2e/tevm-execution.test.ts`, `e2e/unified-bridge.test.ts`
- Dependency: Phase 3

## Phase 5: Spec doc

DONE (756f033): `Specs: add session intents streamlined spec`
- Files: `specs/047-session-intents-streamlined.md`
- Dependency: Phase 3

## Phase 6: Live query shared registry

DONE (61a5733): `LiveQuery: track shared registry`
- Files: `src/svelte/live-query-context.svelte.ts`
- Dependency: none

## Phase 7: Address param parsing helper

DONE (19d7da1): `Address: parse account params`
- Files: `src/lib/address.ts`, `src/lib/address.spec.ts`
- Dependency: none

## Phase 8: AccountsSelect component swap

DONE (c1cedf4): `AccountsSelect: replace Wallets view`
- Files: `src/views/AccountsSelect.svelte`
- Files (delete): `src/views/Wallets.svelte`
- Files: `src/routes/bridge/cctp/CctpWallets.svelte`, `src/routes/rooms/[roomId]/+page.svelte`, `src/routes/test/intents/+page.svelte`
- Files: `src/view/bridge.svelte`, `src/view/swap.svelte`, `src/view/transfer.svelte`, `src/view/liquidity.svelte`
- Dependency: Phase 7

## Phase 9: Accounts + USDC navigation routes

DONE (b10e0c5): `Navigation: add accounts and USDC routes`
- Files: `src/routes/accounts/+page.svelte`, `src/routes/account/[address]/+page.svelte`, `src/routes/account/[address]/+page.ts`
- Files: `src/routes/wallets/+page.svelte`, `src/routes/wallets/Accounts.svelte`
- Files (delete): `src/routes/wallets/WalletsManager.svelte`
- Files: `src/routes/+layout.svelte`, `src/routes/+page.svelte`
- Files: `src/views/Navigation.svelte`, `src/views/NavigationItem.svelte`
- Files: `src/routes/about-old/+page.svelte`, `src/routes/about-old-2/+page.svelte`
- Files: `src/routes/about/ArchitectureGraph.svelte`, `src/routes/about/architecture-graph.ts`
- Files: `src/routes/explore/usdc/+page.svelte`, `src/routes/explore/usdc/LiveTransfers.svelte`
- Files: `src/routes/transfers/+page.svelte`
- Dependency: Phase 8

## Phase 10: Dashboard embedded route grid

DONE (a220cd1): `Dashboard: add embedded route grid`
- Files: `src/routes/dashboard/+page.svelte`, `src/routes/dashboard/Panel.svelte`, `src/routes/dashboard/route-map.ts`
- Dependency: none

## Phase 11: E2E coverage updates

DONE (4a45a7b): `e2e: align routes and coverage`
- Files: `e2e/accessibility.test.ts`, `e2e/coverage-manifest.ts`, `e2e/responsive.test.ts`, `e2e/route-coverage.test.ts`, `e2e/wallet.test.ts`
- Files: `playwright.e2e.config.ts`
- Dependency: Phase 8, Phase 9, Phase 10

## Phase 12: Spec updates

DONE (15c576d): `Specs: document accounts + routes updates`
- Files: `specs/004-bridge-ui.md`, `specs/005-wallet-provider-balances.md`, `specs/006-transfers-visualization.md`
- Files: `specs/014-e2e-bridge-flow.md`, `specs/028-security-checklist.md`, `specs/030-uniswap-v4-interface.md`
- Files: `specs/031-partykit-rooms.md`, `specs/036-circle-cctp-bridge-ui.md`, `specs/039-e2e-test-hardening.md`
- Files: `specs/042-entity-data-sources.md`, `specs/044-dashboard-panels.md`, `specs/046-transaction-sessions.md`
- Files: `specs/047-session-intents-streamlined.md`, `specs/056-formatting-enforcement.md`, `specs/057-yellow-channels-route.md`
- Files: `specs/058-graphscene-local-query-stacks.md`, `specs/059-account-pages.md`
- Dependency: Phase 8, Phase 9, Phase 10, Phase 11

## Phase 13: History notes

DONE (dba00df): `history: record e2e reverify blocks`
- Files: `history/2026-02-04-build-reverify-005-e2e-blocked.md`, `history/2026-02-05-build-reverify-002-e2e-blocked.md`, `history/2026-02-05-build-reverify-039-e2e-blocked.md`
- Dependency: Phase 11

## Commit later

- None

## Uncommitted working tree files

- `COMMIT_PLAN.md`
