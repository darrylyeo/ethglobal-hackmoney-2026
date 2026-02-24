# Spec 121: Uniswap liquidity expand — data sources, schema, entity views

Expand the Liquidity feature with concrete data sources for Uniswap V4 positions and pools, refined schema definitions, and explorable entity views. Builds on Spec 030 (Uniswap V4 interface), Spec 078 (positions nav and pages), Spec 042 (entity data sources), Spec 065 (external API cache), Spec 088 (EntityView).

## References

- [Uniswap V4 Subgraph — Query examples](https://docs.uniswap.org/api/subgraph/guides/v4-examples)
- [Uniswap V4 Subgraph schema](https://github.com/Uniswap/v4-subgraph/blob/main/schema.graphql)
- [Uniswap V4 — Fetching positions](https://docs.uniswap.org/sdk/v4/guides/liquidity/position-fetching) (subgraph for tokenIds + contract for tick/liquidity/pool)
- [Uniswap V4 — PoolId / PoolKey](https://docs.uniswap.org/contracts/v4/reference/core/types/PoolId) (PoolId = keccak256(abi.encode(PoolKey)))
- [Uniswap V4 Deployments](https://docs.uniswap.org/contracts/v4/deployments) (PoolManager, PositionManager per chain)
- [The Graph Studio API keys](https://thegraph.com/studio/apikeys/)
- [The Graph Explorer — Uniswap V4](https://thegraph.com/explorer/subgraphs/DiYPVdygkfjDWhbxGSqAQxwBKmfKnkWQojqeM2rkLb3G) (explore queries per chain)
- [Messari Subgraphs](https://subgraphs.messari.io/) — standardized DEX/AMM subgraphs (uniswap-v3, uniswap-v2); [GitHub](https://github.com/messari/subgraphs), [schema-dex-amm.graphql](https://github.com/messari/subgraphs/blob/master/schema-dex-amm.graphql)
- Spec 030, 078, 042, 065, 088, 091, 094

## Subgraph schema (research summary)

- **Position:** Only `id` (tokenId), `tokenId`, `owner`, `origin`, `createdAtTimestamp`; **no** pool, tickLower, tickUpper, or liquidity. Position discovery = subgraph; position details (pool, ticks, liquidity) = on-chain via PositionManager.
- **Pool:** `id` is the **PoolId** (bytes32, keccak256 of PoolKey), represented as 0x-prefixed hex (e.g. `0x21c67e77068de97969ba93d4aab21826d33ca12bb9f565d8496e8fda8a82ca27`). Pool has token0, token1 (Token refs), feeTier, sqrtPrice, liquidity, tick, tickSpacing, hooks, volumeUSD, totalValueLockedUSD, etc.
- **ModifyLiquidity:** Has `pool`, `tickLower`, `tickUpper`, `amount` but is keyed by transaction; no direct position→pool in subgraph. So position→pool linkage requires on-chain `getPoolAndPositionInfo(tokenId)`.

## Data sources

### 1. Uniswap V4 Subgraph (The Graph)

- **Role:** Discover positions by owner (tokenIds); fetch pool metadata (tokens, fee, liquidity, TVL, volume). V4 PositionManager does not implement ERC721Enumerable — position IDs must come from subgraph.
- **Endpoint:** `https://gateway.thegraph.com/api/<API_KEY>/subgraphs/id/<SUBGRAPH_ID>`. Hosted subgraphs deprecated; use gateway + API key ([The Graph Studio](https://thegraph.com/studio/apikeys/)).
- **Per-chain subgraph IDs:** Subgraph IDs differ by chain. Maintain `chainId → subgraphId` in constants. Examples from Graph Explorer:
  - Arbitrum / mainnet (docs): `DiYPVdygkfjDWhbxGSqAQxwBKmfKnkWQojqeM2rkLb3G`
  - Ethereum: `6XvRX3WHSvzBVTiPdF66XSBVbxWuHqijWANbjJxRDyzr`
  - Base: `5f2npKL2a8oC6thaahyGW5NhJPAtDyMRnQHVmaNSJZ6o`
  - Unichain (130): `EoCvJ5tyMLMJcTnLQwWpjAtPdn74PcrZgzfcT5bYxNBH`
  - Include only chains where we have deployments (see [V4 Deployments](https://docs.uniswap.org/contracts/v4/deployments)) and a published subgraph.
- **Queries:**
  - **Positions by owner:** `positions(where: { owner: $owner }) { id, tokenId, owner, origin, createdAtTimestamp }`. Map to `UniswapPosition` with `id = tokenId.toString()`, `chainId` from request; poolId/tickLower/tickUpper/liquidity left empty until on-chain enrichment.
  - **Pool by id:** `pool(id: $poolId) { id, token0 { id, symbol, decimals }, token1 { id, symbol, decimals }, feeTier, sqrtPrice, liquidity, tick, tickSpacing, hooks, volumeUSD, totalValueLockedUSD }`. `poolId` = PoolId bytes32 hex. Normalize feeTier → fee (number), sqrtPrice → sqrtPriceX96 (bigint).
  - **Pools list:** `pools(first: 1000, skip: $skip, orderBy: liquidity, orderDirection: desc)`; max 1000 per request, paginate with skip.
- **Rate limits:** Gateway rate-limits by API key. On failure/rate-limit return empty and optionally retry with backoff.
- **Cache:** All results upserted into `uniswapPositionsCollection` and `uniswapPoolsCollection` with `$source: DataSource.Uniswap`. UI reads only via live queries (Spec 065).

### 2. On-chain (Voltaire / RPC)

- **Role:** Enrich position with poolId, tickLower, tickUpper, liquidity. Subgraph Position does not expose these; call PositionManager `getPoolAndPositionInfo(tokenId)` and `getPositionLiquidity(tokenId)`; decode packed position info (see [Fetching positions](https://docs.uniswap.org/sdk/v4/guides/liquidity/position-fetching)).
- **Contracts:** [V4 Deployments](https://docs.uniswap.org/contracts/v4/deployments) — PositionManager and PoolManager addresses per chain (Ethereum 1, Unichain 130, Optimism 10, Base 8453, Arbitrum 42161, Polygon 137, Blast 81457, Zora 7777777, etc.).
- **Flow:** (1) Subgraph returns tokenIds for owner. (2) For each tokenId, optional RPC: `getPoolAndPositionInfo(tokenId)` → poolKey (currency0, currency1, fee, tickSpacing, hooks), compute poolId = keccak256(encode(PoolKey)); decode packed info → tickLower, tickUpper. (3) `getPositionLiquidity(tokenId)` → liquidity. Enrichment can be lazy (on position detail) or batch when loading list.

### 3. Messari subgraph (Uniswap V3 / V2)

- **Role:** Optional source for **Uniswap V3** (and V2) liquidity. Messari does not index V4; use for standardized Pool/Position data on V3/V2 across many chains. Same app can show V4 (official subgraph + on-chain) and V3/V2 (Messari).
- **Portal:** [subgraphs.messari.io](https://subgraphs.messari.io/) — deploy status and per-network subgraph IDs. EXCHANGES category includes **uniswap-v3**, **uniswap-v3-swap**, **uniswap-v2**, **uniswap-v2-swap**.
- **Schema:** Standardized [DEX AMM schema](https://github.com/messari/subgraphs/blob/master/schema-dex-amm.graphql) (Pool, Position, PositionSnapshot, Token, Swap, etc.). Entity names and fields differ from Uniswap’s official V4 subgraph; normalizers must map Messari response → our `UniswapPool` / `UniswapPosition` (or a protocol-versioned shape, e.g. `protocolVersion: 'v3' | 'v4'`).
- **Endpoint:** Messari deployments run on The Graph; query via `https://gateway.thegraph.com/api/<API_KEY>/subgraphs/id/<SUBGRAPH_ID>`. Per-network subgraph IDs from [subgraphs.messari.io](https://subgraphs.messari.io/) or repo [deployment/deployment.json](https://github.com/messari/subgraphs/blob/master/deployment/deployment.json).
- **Use:** Add `chainId → messariSubgraphId` for uniswap-v3 (and optionally uniswap-v2) per network. When enabled, `fetchPositionsFromMessari` / `fetchPoolsFromMessari` (or a single client in `src/api/uniswap-messari.ts`) query Messari subgraph and upsert into collections with `$source: DataSource.Messari`. Add `DataSource.Messari` to enum (Spec 042). UI can filter or merge by source/protocol version.
- **Scope in this spec:** Document as supported source; implementation can be “V4 only” first, then add Messari for V3/V2 in a follow-up. Acceptance criteria can treat Messari as optional (e.g. “if Messari is implemented, …”).

### 4. API and constants

- **Subgraph client:** Add `src/api/uniswap-subgraph.ts` with:
  - `fetchPositionsFromSubgraph(params: { chainId: number; owner: `0x${string}` }) => Promise<UniswapPosition[]>`
  - `fetchPoolFromSubgraph(params: { chainId: number; poolId: string }) => Promise<UniswapPool | null>`
  - `fetchPoolsFromSubgraph(params: { chainId: number; first?: number; skip?: number }) => Promise<UniswapPool[]>`
  - Build URL from `getSubgraphUrl(chainId)` using chainId → subgraphId map; API key from env (e.g. `GRAPH_API_KEY` or `THE_GRAPH_API_KEY`).
- **Constants:** In `src/constants/uniswap.ts` (or dedicated file): `UNISWAP_V4_SUBGRAPH_ID: Partial<Record<number, string>>` for supported chains. PositionManager/PoolManager addresses already in constants; ensure chainId set matches deployments.

## Schema refinements

### UniswapPosition (`src/data/UniswapPosition.ts`)

- **Current:** id, chainId, poolId, owner, tickLower, tickUpper, liquidity, token0Owed, token1Owed.
- **Add / refine:**
  - **tokenId:** `bigint` — NFT token id. When present, `id` = `tokenId.toString()` for consistency. Subgraph returns tokenId; contract uses it.
  - **poolId:** keep; set from on-chain enrichment (poolKey → PoolId). Subgraph-only rows have poolId empty until enriched.
  - **origin** (optional): `0x${string}` — minter EOA (from subgraph). **createdAtTimestamp** (optional): number — from subgraph.
  - **tickLower, tickUpper, liquidity:** from contract only; subgraph-only rows use 0 / 0 / 0n until enriched.
- **Normalizer:** Accept subgraph shape (tokenId, owner, id = tokenId, origin, createdAtTimestamp) and optional contract fields; normalize addresses and bigints.

### UniswapPool (`src/data/UniswapPool.ts`)

- **Current:** id, chainId, token0, token1, fee, tickSpacing, hooks, sqrtPriceX96, liquidity, tick.
- **Add (optional, from subgraph):**
  - **token0Symbol**, **token1Symbol**: string
  - **token0Decimals**, **token1Decimals**: number
  - **volumeUSD**, **totalValueLockedUSD**: string or number (subgraph BigDecimal → string for precision or number for display)
- **id:** PoolId bytes32 as 0x-prefixed hex string; same as subgraph Pool.id.
- **Normalizer:** Map subgraph Token (id, symbol, decimals) and pool fields; feeTier → fee; sqrtPrice → sqrtPriceX96 (bigint).

### Source attribution

- **Uniswap V4:** `$source: DataSource.Uniswap` for rows from official subgraph and on-chain enrichment.
- **Messari (V3/V2):** When used, add `DataSource.Messari` to the DataSource enum; rows from Messari subgraph use `$source: DataSource.Messari`. Queries can filter by source or protocol version when merging lists.

## Entity views and routes

### UniswapPosition

- **Entity type:** Already in EntityType. **UniswapPosition$Id:** e.g. `{ chainId: number; id: string }` where id = tokenId string; used in EntityIdByType and path helpers.
- **List:** Existing `/positions/liquidity`; filter by connected actors. Enrich list rows with pool token symbols (join uniswapPoolsCollection by poolId, or denormalize onto position when we have poolId).
- **Detail:** Route `/positions/liquidity/position/[id]/+page.svelte` (id = tokenId). Load position from collection (key = composite chainId+id or by id if unique across chains). Render `<EntityView entityType={EntityType.UniswapPosition}>` with **UniswapPosition.svelte**: pool link, owner, tick range, liquidity, token0/token1 owed, actions (Collect, Remove, Increase) when wallet connected and is owner. Optionally trigger on-chain enrichment when opening detail if poolId/tick/liquidity missing.
- **View:** `src/views/UniswapPosition.svelte` — props `entry: UniswapPosition`; show pool (link to pool detail), network, tick range, liquidity, fees owed; action buttons when applicable.

### UniswapPool

- **Entity type:** Already in EntityType. **UniswapPool$Id:** `{ chainId: number; id: string }` (id = PoolId hex).
- **List:** Route `/positions/liquidity/pools` — live query on `uniswapPoolsCollection`, filter by chain; Sorts (liquidity, volume). Trigger `fetchPoolsFromSubgraph(chainId)` when page loads or chain changes.
- **Detail:** Route `/positions/liquidity/pool/[id]/+page.svelte`. Load pool from collection; render `<EntityView entityType={EntityType.UniswapPool}>` with **UniswapPool.svelte**: token0/token1 (symbols, addresses, links to coin/contract), fee tier, tick, liquidity, volumeUSD, totalValueLockedUSD; optional list of positions in pool later.
- **View:** `src/views/UniswapPool.svelte` — props `entry: UniswapPool`; token pair, fee, sqrtPrice/liquidity/tick, TVL/volume if present.

### Navigation

- **Positions → Liquidity:** Keep **Positions** (href `/positions/liquidity`). Add **Pools** (href `/positions/liquidity/pools`). Detail pages reachable from list links.
- Watched entities for position/pool (Spec 084/091): optional in this spec.

## Implementation summary

| Item | Action |
|------|--------|
| **Subgraph client** | `src/api/uniswap-subgraph.ts`: getSubgraphUrl(chainId), fetchPositionsFromSubgraph, fetchPoolFromSubgraph, fetchPoolsFromSubgraph; env API key. |
| **Messari (optional)** | `src/api/uniswap-messari.ts` and DataSource.Messari; chainId → Messari uniswap-v3 (and optionally v2) subgraph ID; normalizers map Messari schema → UniswapPool/UniswapPosition or versioned shape. |
| **Constants** | chainId → subgraphId map (V4) in `src/constants/uniswap.ts`; optional chainId → Messari subgraphId for V3/V2; only chains with deployments + published subgraph. |
| **Schema** | UniswapPosition: tokenId, optional origin, createdAtTimestamp. UniswapPool: token0Symbol, token1Symbol, token0Decimals, token1Decimals, volumeUSD, totalValueLockedUSD. |
| **Normalizers** | UniswapPositionsNormalize: subgraph Position → row (id=tokenId, poolId/tick/liquidity optional). UniswapPoolsNormalize: subgraph Pool + Token → row (feeTier→fee, sqrtPrice→sqrtPriceX96). |
| **Collections** | fetchUniswapPositions/fetchUniswapPools call subgraph and upsert; optional on-chain enrichment in collection or in detail page. Spec 065 table: Uniswap V4 Subgraph → UniswapPositions, UniswapPools. |
| **Views** | UniswapPosition.svelte, UniswapPool.svelte in src/views/. |
| **Routes** | /positions/liquidity/position/[id], /positions/liquidity/pool/[id], /positions/liquidity/pools. |
| **EntityView** | Position and pool detail pages use EntityView with metadata. |
| **Nav** | navigationItems.svelte.ts: Positions → Liquidity → Pools link. |

## Non-goals

- Other DEXs or protocols beyond Uniswap (V2/V3/V4). Messari’s other exchange subgraphs (e.g. SushiSwap, Balancer) are out of scope unless we add a generic liquidity abstraction.
- Swap UI changes (Spec 030).
- Add Liquidity flow changes beyond subgraph-backed pool list.

## Acceptance criteria

- [ ] **Data source:** Uniswap V4 subgraph client in `src/api/uniswap-subgraph.ts`; fetchPositionsFromSubgraph, fetchPoolFromSubgraph, fetchPoolsFromSubgraph; chainId → subgraphId in constants; API key from env.
- [ ] **Schema:** UniswapPosition has tokenId; optional origin, createdAtTimestamp. UniswapPool has optional token0Symbol, token1Symbol, token0Decimals, token1Decimals, volumeUSD, totalValueLockedUSD. Normalizers updated.
- [ ] **Collections:** Fetch helpers call subgraph and upsert; Spec 065 external-API table updated.
- [ ] **Position list:** Positions list shows data from collection; token pair (symbols) shown when pool available (join or denormalized).
- [ ] **Position detail:** Route `/positions/liquidity/position/[id]` with EntityView and UniswapPosition view; pool link, owner, tick range, liquidity, actions when applicable.
- [ ] **Pool list:** Route `/positions/liquidity/pools`; live query, filter by chain; fetch on load.
- [ ] **Pool detail:** Route `/positions/liquidity/pool/[id]` with EntityView and UniswapPool view; token pair, fee, liquidity, TVL/volume.
- [ ] **Views:** UniswapPosition.svelte and UniswapPool.svelte used on detail pages.
- [ ] **Nav:** Positions → Liquidity includes Pools; detail pages reachable from lists.
- [ ] **Messari (optional):** If implemented: DataSource.Messari in enum; fetch helpers for Messari uniswap-v3 (and optionally v2); chainId → Messari subgraph ID in constants; normalizers map Messari schema; positions/pools list can include or filter by source.

## Status

Incomplete.
