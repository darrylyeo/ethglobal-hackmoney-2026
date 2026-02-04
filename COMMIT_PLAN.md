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
- Files: `src/views/Wallets.svelte`
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

## Commit later

- None

## Uncommitted working tree files

- `COMMIT_PLAN.md`
