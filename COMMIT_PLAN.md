# Commit Plan

## Completed (2026-02-12)

| # | SHA | Message |
|---|-----|---------|
| 1 | b83f152 | specs: add 096-100 |
| 2+3 | 9a1fdf0 | lib: transfer-classify, simulationResult; constants: cctp, collections |
| 4 | 86aef6d | collections: BridgeTransferEvents, SwapTransferEvents |
| 5 | ff9ef6f | components: TreeNode (spec 098) |
| 6 | ea8dd75 | components: Filters (spec 099) |
| 7 | 20481b3 | components: Select/Combobox items API (spec 100) |
| 8 | a17cc10 | views: coin page sections (spec 096) |
| 9 | 318c522 | SigmaGraphView: simplify |
| 10 | d29b16f | api, data |
| 11 | c752c0e | misc |

## Topological Order (template)

### Commit 1: specs: add 096-100
- specs/096-coin-page-sections.md
- specs/097-helios-integration.md
- specs/098-tree-node-component.md
- specs/099-filters-component.md
- specs/100-select-combobox-items-api.md

### Commit 2: constants: cctp extensions, collections BridgeTransferEvents/SwapTransferEvents
- src/constants/cctp.ts
- src/constants/collections.ts

### Commit 3: lib: add transfer-classify, simulationResult
- src/lib/transfer-classify.ts
- src/lib/simulationResult.ts

### Commit 4: collections: add BridgeTransferEvents, SwapTransferEvents; update TransferEvents, Contracts
- src/collections/BridgeTransferEvents.ts
- src/collections/SwapTransferEvents.ts
- src/collections/TransferEvents.ts
- src/collections/Contracts.ts

### Commit 5: components: TreeNode (spec 098)
- src/components/TreeNode.svelte
- src/views/NavigationItem.svelte
- src/routes/dashboard/PanelTree.svelte
- src/routes/agents/[nodeId]/AgentChatTurnNode.svelte

### Commit 6: components: Filters (spec 099)
- src/components/Filters.svelte

### Commit 7: components: Select/Combobox items API (spec 100)
- src/components/Select.svelte
- src/components/Combobox.svelte
- src/components/SelectMultiple.svelte (untracked)
- src/components/ComboboxMultiple.svelte (untracked)
- All consumer updates (Avatar, ModelInput, etc.)

### Commit 8: coin page sections (spec 096)
- src/views/CoinActivity.svelte
- src/views/CoinBridgeTransfers.svelte
- src/views/CoinContracts.svelte
- src/views/CoinSwaps.svelte
- src/views/CoinTransfers.svelte
- src/views/TransferEvent.svelte
- src/routes/coin/[symbol]/+page.svelte

### Commit 9: SigmaGraphView: simplify (remove Sigma/ForceAtlas2)
- src/components/SigmaGraphView.svelte
- src/routes/GraphScene.svelte

### Commit 10: api, data
- src/api/sourcify.ts
- src/data/VerifiedContractSource.ts

### Commit 11: remaining routes, views, components, styles
- All other modified files

### Commit 12: .cursor/agents atomic-committer
- .cursor/agents/atomic-committer.md

## Commit later / ignore
- (none specified)
