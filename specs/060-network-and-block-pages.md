# Spec 060: Network and block pages

Add detail routes for a network (chain) and for a specific block on that network.
Use CAIP-2 (EIP155) and a consistent slug scheme for entity IDs and URLs.

## Scope

- **Routes**
  - `/network/[name]` — network detail; `[name]` is either a slug (e.g. `ethereum`, `base-sepolia`) or a CAIP-2 chain id (e.g. `eip155:1`).
  - `/network/[name]/block/[blockNumber]` — block detail on that network; `[blockNumber]` is decimal.
- **Identifiers**
  - **CAIP-2** (chain): `namespace:reference`; for EVM use EIP-155: `eip155:<chainId>` (e.g. `eip155:1`). See [CAIP-2](https://chainagnostic.org/CAIPs/caip-2), [EIP-155](https://eips.ethereum.org/EIPS/eip-155).
  - **Block**: no formal CAIP for block ref in EIP155; use app convention `eip155:<chainId>:<blockNumber>` for serializing chain+block (CAIP-2 plus block number).
  - **Slug**: lowercase, spaces → hyphens, from network display name (e.g. "Base Sepolia" → `base-sepolia`) for readable URLs; resolve to chainId via constants.
- **Data**
  - Network: from `networkConfigs` / `networksByChainId` (no fetch).
  - Block: fetch via Voltaire `eth_getBlockByNumber` when visiting block page; store in TanStack DB blocks collection for caching and graph display.
- **Graph**
  - Network nodes already exist (EntityType.Network); ensure node `details` include `caip2` and `slug` so selection can link to `/network/{slug|caip2}`.
  - Add Block entity type and blocks collection; add graph nodes for blocks in the collection with edges to Network; block nodes get `block:<chainId>:<blockNumber>` id and link to block page.
- **Navigation**
  - Under **Explore**: **Coins** (child: USDC → `/coin/USDC`) and **Networks** (child: only networks relevant to the user — those that appear in wallet connections or session params/execution; one link per such network → `/network/{slug}`; no count tag).

## Non-goals

- Supporting non-EIP155 namespaces.
- Block listing/pagination (single block view only).
- Indexing all blocks; blocks appear in graph only after being fetched (e.g. by visiting the block page).

## Acceptance criteria

- [x] `/network/[name]` resolves for slug and for `eip155:<chainId>`; 404 for unknown name.
- [x] Network page shows network name, chain id, type (mainnet/testnet), explorer link, and optional link to block explorer block list.
- [x] `/network/[name]/block/[blockNumber]` resolves when network is valid and blockNumber is decimal; 404 otherwise.
- [x] Block page fetches block via Voltaire, caches in blocks collection; shows number, timestamp (transaction count when available from API).
- [x] Constants expose: `toCaip2(chainId)`, `parseNetworkNameParam(name)` (→ `{ chainId, config, slug, caip2 }`), `toNetworkSlug(name)`, `getNetworkBySlug(slug)`, `getNetworkByCaip2(caip2)`; explorers expose `getBlockUrl(chainId, blockNumber)`.
- [x] Graph: Network node details include `caip2` and `slug`; selection panel links to `/network/{slug}` for Network nodes. Block entity type and blocks collection exist; graph renders block nodes when blocks collection has data; block nodes link to block page; edges from Network to Block.
- [x] Navigation: **Explore** contains **Coins** (→ USDC) and **Networks** (one child per relevant network only, from wallet connections and sessions; no count).

## Status

Complete.

## Output when complete

`DONE`
