# Commit Plan — Topological, granular

**Scope:** All modified + new files. **Excluded:** All `.html` files (leave untracked).

---

## Phase 1: Constants (foundation)

### 1. constants: unify Network type, networksByChainId, ParsedNetworkParam
- **Files:** `src/constants/networks.ts`
- **Summary:** NetworkConfig → Network (single type with chainId, slug, caip2, etc.); networkConfigs → networks; networkConfigsByChainId → networksByChainId; ParsedNetworkParam.config → .network; networkConfigsBySlug/Caip2 → networksBySlug/networksByCaip2; mainnetForTestnet Number() fixes.

### 2. constants: CollectionId.ChainIdChains, DataSource.ChainList, colors comment
- **Files:** `src/constants/collections.ts`, `src/constants/data-sources.ts`, `src/constants/colors.ts`
- **Summary:** Add enum values and update colors.ts comment.

### 3. constants: coins, filter-groups use networksByChainId and n.chainId
- **Files:** `src/constants/coins.ts`, `src/constants/filter-groups.ts`
- **Summary:** Use networksByChainId; filter-groups n.id → n.chainId.

---

## Phase 2: Lib (depend on networks)

### 4. lib: use new network exports and ParsedNetworkParam.network
- **Files:** `src/lib/id-serialization.ts`, `src/lib/patterns.ts`, `src/lib/network-paths.ts`, `src/lib/entity-color.ts`, `src/lib/wallet.ts`, `src/lib/wallet.spec.ts`
- **Summary:** networkConfigsBy* → networksBy*; config → network; pattern/comment updates.

---

## Phase 3: API

### 5. api: contract-discovery, viem-client, yellow — networksByChainId
- **Files:** `src/api/contract-discovery.ts`, `src/api/viem-client.ts`, `src/api/yellow.ts`
- **Summary:** Use networksByChainId and network variable naming.

### 6. api: lifi — DataSource query keys, networksByChainId
- **Files:** `src/api/lifi.ts`
- **Summary:** Query keys use DataSource.LiFi; use networksByChainId if any.

### 7. api: add Chainlist client
- **Files:** `src/api/chainlist.ts` (new)
- **Summary:** Chainlist (chainlist.org) fetch client for ChainIdChains.

---

## Phase 4: Collections

### 8. collections: add ChainIdChains
- **Files:** `src/collections/ChainIdChains.ts` (new)
- **Summary:** TanStack collection for Chainlist chains; uses CollectionId, DataSource.

### 9. collections: CollectionId queryKey; Networks entry.chainId
- **Files:** `src/collections/Actors.ts`, `src/collections/Coins.ts`, `src/collections/FarcasterChannels.ts`, `src/collections/Networks.ts`, `src/collections/TokenListCoins.ts`
- **Summary:** queryKey uses CollectionId enum; Networks normalizeNetwork $id.chainId (entry.chainId).

---

## Phase 5: Routes

### 10. routes: network pages — config→network, .id→.chainId, showContextUrl inline
- **Files:** `src/routes/network/[name]/+page.svelte`, `src/routes/network/[name]/block/[blockNumber]/+page.svelte`, `src/routes/network/[name]/block/[blockNumber]/transaction/[transactionId]/+page.svelte`, `src/routes/network/[name]/contract/[address]/+page.svelte`, `src/routes/network/[name]/contracts/+page.svelte`, `src/routes/network/[name]/transaction/[transactionId]/+page.svelte`, `src/routes/networks/+page.svelte`
- **Summary:** parsed?.config → parsed?.network; config → network; n.id → n.chainId; txRow/blockRow → tx/block; inline “Show Context” hrefs.

### 11. routes: GraphScene, bridge, navigationItems, session, test, wallets
- **Files:** `src/routes/GraphScene.svelte`, `src/routes/bridge/cctp/CctpBridgeFlow.svelte`, `src/routes/bridge/lifi/BridgeFlow.svelte`, `src/routes/navigationItems.svelte.ts`, `src/routes/session/Action.svelte`, `src/routes/session/Session.svelte`, `src/routes/test/intents/+page.svelte`, `src/routes/wallets/Accounts.svelte`
- **Summary:** config→network, networkConfigs→networks, n.id→n.chainId where applicable.

---

## Phase 6: Views

### 12. views: config→network, .id→.chainId
- **Files:** `src/views/AccountContracts.svelte`, `src/views/AccountsSelect.svelte`, `src/views/Address.svelte`, `src/views/CoinAmount.svelte`, `src/views/CoinBalances.svelte`, `src/views/CoinContracts.svelte`, `src/views/CoinName.svelte`, `src/views/NetworkIcon.svelte`, `src/views/NetworkInput.svelte`, `src/views/NetworkName.svelte`, `src/views/NetworksInput.svelte`, `src/views/TokenContracts.svelte`, `src/views/architecture-graph.ts`, `src/views/network/Network.svelte`
- **Summary:** Use network naming and chainId consistently.

---

## Phase 7: Cursor rule (optional)

### 13. cursor: add deno-only rule
- **Files:** `.cursor/rules/deno-only.mdc`
- **Summary:** Rule to use Deno only, no pnpm.

---

## Commit later / leave uncommitted
- All `*.html` files (per user request): `_layout-scroll-snap-test*.html`

---

## Current working tree (new commits — topological)

### N1. constants: define ChainId in networks, remove chain-id.ts
- **Files:** `src/constants/networks.ts`, `src/constants/chain-id.ts` (D), `src/api/identity-resolve.ts`, `src/api/contract-discovery.ts`, `src/collections/IdentityLinks.ts`, `src/constants/actions.ts`, `src/constants/identity-resolver.ts`, `src/constants/rpc-endpoints.ts`, `src/data/Network.ts`, `src/lib/cctp.ts`, `src/lib/entity-color.ts`, `src/lib/gateway.ts`, `src/lib/session/resolveSigningPayloads.ts`, `src/lib/transfer-classify.ts`, `src/lib/farcaster-watch.ts` (ChainId hunk only if split)
- **Summary:** Inline ChainId enum in networks.ts; delete chain-id.ts; update all ChainId imports to networks.

### N2. lib: rename query-client to queryClient
- **Files:** `src/lib/db/query-client.ts` (D), `src/api/lifi.spec.ts`, `src/api/lifi.ts`, `src/collections/Actors.ts`, `src/collections/ChainIdChains.ts`, `src/collections/Coins.ts`, `src/collections/FarcasterChannels.ts`, `src/collections/Networks.ts`, `src/collections/TokenListCoins.ts`, `specs/002-tanstack-db-collections.md`
- **Summary:** Delete query-client.ts; update imports to queryClient.ts; spec 002 path.

### N3. constants: remove colors.ts
- **Files:** `src/constants/colors.ts` (D)
- **Summary:** Remove unused colors module (coinColorBySymbol in coins).

### N4. api: use farcaster/index, remove api/farcaster re-export
- **Files:** `src/api/farcaster.ts` (D), `src/collections/FarcasterCasts.ts`, `src/collections/FarcasterChannels.ts`, `src/collections/FarcasterLinks.ts`, `src/collections/FarcasterUsers.ts`, `src/lib/farcaster-watch.ts` (farcaster import hunk if not in N1)
- **Summary:** Import from api/farcaster/index.ts; delete api/farcaster.ts.

### N5. lib: reorder — use attachments and state, remove index
- **Files:** `src/lib/reorder/index.ts` (D), `src/components/EditableItemsList.svelte`, `src/routes/session/ActionsSequence.svelte`
- **Summary:** Import from reorder/attachments.svelte.ts and state.svelte.ts; delete reorder/index.ts.

### N6. constants: remove re-exports from intents
- **Files:** `src/constants/intents.ts`, `src/lib/intents.ts`, `src/lib/intents.test.ts`, `src/lib/intents/resolve.spec.ts`
- **Summary:** Drop re-exports from intents; consumers import from actions, protocolActions, protocols, lib/intents.

### N7. lib: bridge-limits — drop AmountValidationError re-export
- **Files:** `src/lib/bridge-limits.ts`
- **Summary:** Remove re-export of AmountValidationError.

### N8. collections: drop barrel re-exports
- **Files:** `src/collections/PartykitRoomPeers.ts`, `src/collections/RoomPeers.ts`, `src/collections/Rooms.ts`, `src/collections/SharedAddresses.ts`, `src/collections/SiweChallenges.ts`
- **Summary:** Remove trailing re-export lines from collection files.

### N9. collections: Blocks import style
- **Files:** `src/collections/Blocks.ts`
- **Summary:** Multi-line import from networks.

### N10. specs: update 001, 002
- **Files:** `specs/001-constants-and-networks.md`, `specs/002-tanstack-db-collections.md`
- **Summary:** Doc updates for chain-id removal, queryClient path.

### N11. components: spec 111 derived/formatting
- **Files:** `src/components/Code.svelte`, `src/components/EditableItemsList.svelte`, `src/components/EntityId.svelte`, `src/components/EntityView.svelte`, `src/components/Heading.svelte`, `src/components/Icon.svelte`, `src/components/IntentDragPreview.svelte`, `src/components/ItemsList.svelte`, `src/components/ItemsListView.svelte`, `src/components/Media.svelte`, `src/components/Qr.svelte`, `src/components/Select.svelte`, `src/components/Timestamp.svelte`, `src/components/TruncatedValue.svelte`, `src/components/WatchButton.svelte`
- **Summary:** $derived / $derived.by usage and multi-line formatting per spec 111.

### N12. routes: config→network, formatting, derived
- **Files:** All modified route files (dashboard, account, coin, network, session, farcaster, etc.)
- **Summary:** config→network, .id→.chainId, spec 111 formatting, minor cleanup.

### N13. views: config→network, formatting, derived
- **Files:** All modified view files
- **Summary:** network naming, spec 111 formatting.

### N14. specs: add 110, 111
- **Files:** `specs/110-external-abi-signature-apis.md`, `specs/111-derived-derived-by-usage.md`
- **Summary:** New spec documents.

### N15. COMMIT_PLAN: update with new commits
- **Files:** `COMMIT_PLAN.md`
- **Summary:** Record SHAs for N1–N14.

---

## New commits completed
| # | SHA | Message |
|---|-----|---------|
| N1 | 3e60d96 | constants: define ChainId in networks, remove chain-id.ts |
| N2 | ef6229c | lib: rename query-client to queryClient |
| N3 | 49adb97 | constants: remove colors.ts |
| N4 | 2c43595 | api: use farcaster/index, remove api/farcaster re-export |
| N5 | f1bc029 | lib: reorder — use attachments and state, remove index |
| N6 | 3e70446 | constants: remove re-exports from intents |
| N7 | 5681b0a | lib: bridge-limits — drop AmountValidationError re-export |
| N8 | 708145f | collections: drop barrel re-exports |
| N9 | 86246bc | collections: Blocks import style |
| N10 | db0d190 | specs: update 001, 002 (chain-id, queryClient) |
| N11 | dc1323c | components: spec 111 derived/formatting |
| N12 | cf6e40f | routes: config→network, formatting, derived |
| N13 | fc957a3 | views: config→network, formatting, derived |
| N14 | 9032723 | specs: add 110, 111 |

---

## Completed (fill after execution)
| # | SHA | Message |
|---|-----|---------|
| 1 | efb49cb | constants: unify Network type, networksByChainId, ParsedNetworkParam |
| 2 | 61fa810 | constants: CollectionId.ChainIdChains, DataSource.ChainList, colors comment |
| 3 | c876247 | constants: coins, filter-groups use networksByChainId and n.chainId |
| 4 | a511d8c | lib: use new network exports and ParsedNetworkParam.network |
| 5 | 7d60862 | api: contract-discovery, viem-client, yellow — networksByChainId |
| 6 | 6b4b186 | api: lifi — DataSource query keys |
| 7 | — | api: add Chainlist client (included in e90d9e2) |
| 8 | e90d9e2 | collections: add ChainIdChains (+ chainlist.ts) |
| 9 | 8bcd3b6 | collections: CollectionId queryKey; Networks entry.chainId |
| 10 | 457b19e | routes: network pages — config→network, .id→.chainId |
| 11 | b67f68a | routes: GraphScene, bridge, navigationItems, session, test, wallets |
| 12 | e3609db | views: config→network, .id→.chainId |
| 13 | c28a7e6 | cursor: add deno-only rule |
