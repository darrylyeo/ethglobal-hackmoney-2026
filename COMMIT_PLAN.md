# Atomic commit plan

## Scope
All current changes (modified, added, deleted) in ethglobal-hackmoney-2026. Topological order; build verified where practical.

## Commit message style (from git log)
- `area: short description` (e.g. `specs: add 110, 111`, `api: lifi — DataSource query keys`)
- Optional detail: `config→network`, `formatting`, `derived`

---

## Phase 1: Specs and config

| # | Commit message | Files | Deps |
|---|----------------|-------|------|
| 1 | specs: add 112–115 (EIP/ERC list, fork-era, EIP-8004, chat-turn payments) | specs/112-eip-erc-list-official-sources.md, specs/113-fork-era-schedules-explorer-context.md, specs/114-eip-8004-agent-explorer.md, specs/115-chat-turn-eip1193-x402-payments.md | — |
| 2 | specs: path renames and formatting (002, 005, 011, 030–033, 045, 052, 055–059, 061, 063, 065–066, 068, 070, 073, 077, 083–088, 090, 095, 097, 103–104, 106–108, 110) | All modified specs/*.md | — |
| 3 | deno: test:unit add api spec files; package @mcp-b/global | deno.json, package.json, deno.lock | — |

---

## Phase 2: Constants (foundation)

| # | Commit message | Files | Deps |
|---|----------------|-------|------|
| 4 | constants: add chain-id for lightweight ChainId (tests/assets) | src/constants/chain-id.ts | — |
| 5 | constants: add sqd-datasets, fork-upgrades, helios-chains, helios-config | src/constants/sqd-datasets.ts, src/constants/fork-upgrades.ts, src/constants/helios-chains.ts, src/constants/helios-config.ts | chain-id for helios-chains, sqd-datasets |

---

## Phase 3: Data models

| # | Commit message | Files | Deps |
|---|----------------|-------|------|
| 6 | data: add SelectorSignature, ProposalEntry | src/data/SelectorSignature.ts, src/data/ProposalEntry.ts | — |

---

## Phase 4: API layer

| # | Commit message | Files | Deps |
|---|----------------|-------|------|
| 7 | api: contract-discovery use chain-id, re-export ChainId | src/api/contract-discovery.ts | chain-id |
| 8 | api: add etherscan + spec (ABI fetch) | src/api/etherscan.ts, src/api/etherscan.spec.ts | contract-discovery |
| 9 | api: add blockscout + spec (ABI fetch) | src/api/blockscout.ts, src/api/blockscout.spec.ts | contract-discovery |
| 10 | api: add fourbyte + spec (selector signatures) | src/api/fourbyte.ts, src/api/fourbyte.spec.ts | — |
| 11 | api: add openchain + spec (selector signatures) | src/api/openchain.ts, src/api/openchain.spec.ts | — |
| 12 | api: add sqd + spec (traces/stream) | src/api/sqd.ts, src/api/sqd.spec.ts | sqd-datasets |
| 13 | api: add eips (proposal entries) | src/api/eips.ts | ProposalEntry |

---

## Phase 5: Collections and constants

| # | Commit message | Files | Deps |
|---|----------------|-------|------|
| 14 | constants: collections add SelectorSignatures, Proposals | src/constants/collections.ts | — |
| 15 | collections: add SelectorSignatures (fourbyte, openchain) | src/collections/SelectorSignatures.ts | fourbyte, openchain, SelectorSignature |
| 16 | collections: add Proposals (eips API) | src/collections/Proposals.ts | ProposalEntry, eips |
| 17 | collections: Contracts use etherscan/blockscout ABI, DataSource | src/collections/Contracts.ts | etherscan, blockscout |
| 18 | api/collections: TransactionTraces, transfers-logs use SQD | src/collections/TransactionTraces.ts, src/api/transfers-logs.ts | sqd, sqd-datasets |

---

## Phase 6: Entity type, view, routes

| # | Commit message | Files | Deps |
|---|----------------|-------|------|
| 19 | data: $EntityType add Proposal | src/data/$EntityType.ts | ProposalEntry |
| 20 | views: add Proposal.svelte | src/views/Proposal.svelte | ProposalEntry |
| 21 | routes: add eips (list, forks, [number]) | src/routes/eips/+page.svelte, src/routes/eips/forks/+page.svelte, src/routes/eips/[number]/+page.svelte | Proposals, ProposalEntry, Proposal view |
| 22 | routes: add settings/profiles page | src/routes/settings/profiles/+page.svelte | — |

---

## Phase 7: Lib (new)

| # | Commit message | Files | Deps |
|---|----------------|-------|------|
| 23 | lib: add graphWatchedScope, helios-rpc | src/lib/graphWatchedScope.ts, src/lib/helios-rpc.ts | — |
| 24 | lib: add webmcp driver (schemas, tools, handlers, register) | src/lib/webmcp/* | — |

---

## Phase 8: Session/network SelectorSignatures consumers

| # | Commit message | Files | Deps |
|---|----------------|-------|------|
| 25 | session/network: use SelectorSignatures in Calldata, Event, Transaction | src/routes/session/Calldata.svelte, src/views/network/Event.svelte, src/views/network/Transaction.svelte | SelectorSignatures |

---

## Phase 9: E2E

| # | Commit message | Files | Deps |
|---|----------------|-------|------|
| 26 | e2e: accessibility, coverage-manifest, farcaster updates | e2e/accessibility.test.ts, e2e/coverage-manifest.ts, e2e/farcaster.test.ts | — |

---

## Phase 10: Remaining modified (by area)

| # | Commit message | Files | Deps |
|---|----------------|-------|------|
| 27 | api: formatting, types (approval, chainlist, gateway-execution, identity-resolve, siwf, sourcify, spandex, yellow) | src/api/approval.ts, chainlist.ts, gateway-execution.ts, identity-resolve.ts, siwf.ts, sourcify.ts, spandex.ts, yellow.ts | — |
| 28 | collections: formatting/imports (ActorAllowances, ActorCoins, Blocks, Contracts, EvmActorProfiles, IdentityLinks, NetworkTransactions, StorkPrices, TransactionTraces, TransferEvents) | src/collections/*.ts (remaining modified) | — |
| 29 | components: formatting/derived (Boundary, Code, EntityId, EntityList, EntityView, FarcasterAccountSelect, Heading, Icon, ItemsList, Media, PaginationPlaceholder, Qr, Select, Timestamp, TruncatedValue, WatchButton) | src/components/*.svelte | — |
| 30 | constants: intents, data-sources | src/constants/intents.ts, data-sources.ts | — |
| 31 | lib: formatting/imports (address, bridge-limits, cctp, coin-icon, dedupeInFlight, entity-color, farcaster-paths, farcaster-watch, formatRelativeTime, gateway, id-serialization, network-paths, patterns, profile, protocols/bridgeProtocolOptions, simulationResult, slippage, syntax-highlight, transfer-classify, wallet) | src/lib/*.ts (remaining modified) | — |
| 32 | routes: layout, page, GraphScene, dashboard, farcaster, network, rooms, session, wallets, navigationItems | src/routes/+layout.svelte, +page.svelte, GraphScene.svelte, dashboard/*, farcaster/*, network/*, rooms/*, session/*, wallets/*, navigationItems.svelte.ts | — |
| 33 | state: graph-scene | src/state/graph-scene.svelte.ts | — |
| 34 | styles: components.css | src/styles/components.css | — |
| 35 | views: Address, AddressInput, BlockNumber, CoinAmount, Contract, network/*, farcaster/*, etc. | All remaining src/views/*.svelte | — |

---

## Completed (SHAs)
| # | SHA | Message |
|---|-----|---------|
| 1 | 01d00ee | specs: add 112–115 (EIP/ERC list, fork-era, EIP-8004, chat-turn payments) |
| 2 | aadb9b8 | specs: path renames and formatting (002, 005, 011, 030–110) |
| 3 | c42e65f | deno: test:unit add api spec files; package @mcp-b/global |
| 4 | ccbcdd3 | constants: add chain-id for lightweight ChainId (tests/assets) |
| 5 | 4a851ac | constants: add sqd-datasets, fork-upgrades, helios-chains, helios-config |
| 6 | 4528233 | data: add SelectorSignature, ProposalEntry |
| 7 | 311ca14 | api: contract-discovery use chain-id, re-export ChainId |
| 8 | ab873eb | api: add etherscan + spec (ABI fetch) |
| 9 | 00370ea | api: add blockscout + spec (ABI fetch) |
| 10 | 1c99d9f | api: add fourbyte + spec (selector signatures) |
| 11 | 7b4017a | api: add openchain + spec (selector signatures) |
| 12 | 821251d | api: add sqd + spec (traces/stream) |
| 13 | 3b7ead3 | api: add eips (proposal entries) |
| 14 | 34b939f | constants: collections add SelectorSignatures, Proposals |
| 15 | 4910084 | collections: add SelectorSignatures (fourbyte, openchain) |
| 16 | — | *(Proposals included in 17)* |
| 17 | 5877323 | collections: Contracts use etherscan/blockscout ABI, DataSource (+ Proposals) |
| 18 | 8ac13fb | api/collections: TransactionTraces, transfers-logs use SQD |
| 19 | 28bb644 | data: $EntityType add Proposal |
| 20 | d3dd49b | views: add Proposal.svelte |
| 21 | d1295b3 | routes: add eips (list, forks, [number]) |
| 22 | 64d5fd6 | routes: add settings/profiles page |
| 23 | 073292b | lib: add graphWatchedScope, helios-rpc |
| 24 | 0b312db | lib: add webmcp driver (schemas, tools, handlers, register) |
| 25 | — | *(SelectorSignatures in Calldata, Event, Transaction included in 26)* |
| 26 | 49e73eb | e2e: accessibility, coverage-manifest, farcaster updates |
| 27 | 7ed5950 | api: formatting, types (approval, chainlist, …) |
| 28 | 758a35f | collections: formatting/imports (ActorAllowances, …) |
| 29 | c7fb63b | components: formatting/derived (Boundary, Code, …) |
| 30 | 465d9f3 | constants: intents, data-sources |
| 31 | f59fdac | data: AgentChatTurn, Block, Contract |
| 32 | 9fe16e8 | lib: formatting/imports (address, bridge-limits, …) |
| 33 | f8df211 | routes: layout, page, GraphScene, dashboard, farcaster, … |
| 34 | c30b39d | state: graph-scene; styles: components.css |
| 35 | e59a4b6 | views: Address, AddressInput, BlockNumber, … |

## Commit later
None.

## Uncommitted after plan
- `COMMIT_PLAN.md` (this file; plan update only)
