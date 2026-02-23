# Spec 060: Network and block pages

Add detail routes for a network (chain) and for a specific block on that network.
Use chainId for URLs; CAIP-2 is derived as `eip155:${chainId}` where needed.

## Scope

- **Routes**
  - `/network/[name]` — network detail; `[name]` is numeric chainId or CAIP-2 (e.g. `eip155:1`). Resolved via `parseNetworkNameParam`.
  - `/network/[name]/block/[blockNumber]` — block detail on that network; `[blockNumber]` is decimal.
- **Identifiers**
  - **CAIP-2** (chain): `eip155:<chainId>`; derived from chainId when needed for display or external APIs. See [CAIP-2](https://chainagnostic.org/CAIPs/caip-2), [EIP-155](https://eips.ethereum.org/EIPS/eip-155).
  - **Block**: no formal CAIP for block ref in EIP155; use app convention `eip155:<chainId>:<blockNumber>` for serializing chain+block.
- **Data**
  - Network: from `networksByChainId` (no fetch). No slug/caip2 on Network type; path helpers use chainId (e.g. `/network/${chainId}`).
  - Block: fetch via Voltaire `eth_getBlockByNumber` when visiting block page; store in TanStack DB blocks collection for caching and graph display.
- **Graph**
  - Network nodes (EntityType.Network); selection links to `/network/{chainId}`.
  - Add Block entity type and blocks collection; add graph nodes for blocks in the collection with edges to Network; block nodes get `block:<chainId>:<blockNumber>` id and link to block page.
- **Navigation**
  - Under **Explore**: **Coins** (child: USDC → `/coin/USDC`) and **Networks** (child: only networks relevant to the user; one link per such network → `/network/{chainId}`; no count tag).

## Non-goals

- Supporting non-EIP155 namespaces.
- Block listing/pagination (single block view only).
- Indexing all blocks; blocks appear in graph only after being fetched (e.g. by visiting the block page).

## Acceptance criteria

- [x] `/network/[name]` resolves for numeric chainId and for `eip155:<chainId>`; 404 for unknown name.
- [x] Network page shows network name, chain id, type (mainnet/testnet), explorer link, and optional link to block explorer block list.
- [x] `/network/[name]/block/[blockNumber]` resolves when network is valid and blockNumber is decimal; 404 otherwise.
- [x] Block page fetches block via Voltaire, caches in blocks collection; shows number, timestamp (transaction count when available from API).
- [x] Constants: `networks`, `networksByChainId` (no slug/caip2 on Network; no networksBySlug/networksByCaip2). Lib: `parseNetworkNameParam(name)` → `{ chainId, network }` in `lib/patterns.ts`; path helpers in `lib/network-paths.ts` use chainId (e.g. `/network/${chainId}`); explorers expose `getBlockUrl(chainId, blockNumber)`.
- [x] Graph: Network node selection links to `/network/{chainId}`. Block entity type and blocks collection exist; graph renders block nodes when blocks collection has data; block nodes link to block page; edges from Network to Block.
- [x] Navigation: **Explore** contains **Coins** (→ USDC) and **Networks** (one child per relevant network only, from wallet connections and sessions; no count).

## Status

Complete.

## Output when complete

`DONE`
