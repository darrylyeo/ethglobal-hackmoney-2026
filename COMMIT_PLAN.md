# Commit plan

## Phase 1: Contracts, traces, verified sources (topological)

1. **specs**: 089, 090 + modified spec files
2. **data**: Contract, TransactionTrace, VerifiedContractSource, $EntityType
3. **api**: sourcify, contract-discovery
4. **lib**: abi, syntax-highlight
5. **constants**: collections, data-sources
6. **collections**: Contracts, TransactionTraces, VerifiedContractSources
7. **components**: Code.svelte
8. **views**: Contract, ContractAction, ContractSourceBlock, VerifiedContractSource, TokenContracts, AccountContracts, NetworkContracts, Event, Transaction (network)
9. **routes**: contract pages, network transaction/block pages (incl. deleted +page.ts)

## Phase 2: Route and layout

10. **routes**: layout, navigationItems, remaining route/page changes and deleted +page.ts

## Phase 3: Rest

11. **lockfile**: deno.lock, package.json
12. **misc**: remaining modified (api, collections, constants, data, lib, views, routes)
13. **untracked**: id-serializations, lib/*, CoinName, specs 091–095
