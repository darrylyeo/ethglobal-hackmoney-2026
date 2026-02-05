# Spec 006: Coin pages and transfer/bridge visualization

Add a coin detail route that renders a time-windowed visualization of all
transfer + bridge events for the given symbol. The visualization behavior and
data-flow are based on the existing transfers visualization spec, but extended
to cover all coins matching the symbol across chains.

## Scope

- New route: `/coin/[symbol]`
- Supported symbols at launch: **USDC** and **ETH**.
- Use existing APIs and TanStack DB collections to resolve transfer/bridge
  events and render the visualization.
- Reuse existing visualization components where possible; only create new
  components if none already exist.

## Data sources (by symbol, across chains)

**Primary source: JSON-RPC event filters (Voltaire)**

- Use `eth_getLogs` with the ERC-20 `Transfer(address,address,uint256)` event
  signature for all coins matching the symbol on supported chains.
- For ETH, use native transfer events sourced via existing indexed transaction
  data (not ERC-20 logs) and normalize into the same event shape.
- Build filters by `fromBlock`/`toBlock` derived from the selected time window
  (resolve block numbers by timestamp).
- Voltaire handles ABI/event signatures and RPC plumbing.

**Bridge indexers (for enrichment only)**

- Use relevant indexers to map transfer events to bridge-specific metadata
  (CCTP, canonical bridges, etc.) when available.
- Indexers are not the source of truth; they only enrich transfer edges with
  bridge context.

## Page and component

- **Route:** `src/routes/coin/[symbol]/+page.svelte` — `/coin/{symbol}`
- **Component:** reuse the existing LiveTransfers visualization where possible.
  - **Props:** list of coins resolved by symbol, plus the selected time period.
  - **Behavior:**
    - Time period selector: 1h, 6h, 12h, 1d, 3d, 7d.
    - For the selected period, query TanStack DB collections populated from
      JSON-RPC logs / indexed transactions for the coins across supported
      chains.
    - From the fetched events, derive **unique actor addresses** and treat them
      as **nodes**.
    - **Edges:** flows of coins between two actor addresses. Volume = sum of
      amounts for that (from, to) pair; retain per-transfer timestamps for
      staggering.
    - Render a **Threlte** visualization:
      - Nodes: one per unique actor (position by layout or chain).
      - Edges: represent transfer volume; animate/stagger by timestamp.
    - Account for **amounts** and **chains** (e.g. node/edge color by chain).

## Data flow

1. User selects time period (1h, 6h, 12h, 1d, 3d, 7d).
2. Map period to a time range (e.g. `[now - period, now]`).
3. Resolve per-chain `fromBlock`/`toBlock` for the time range.
4. For each supported chain + coin matching the symbol, fetch logs via Voltaire
   using the ERC-20 Transfer event topic.
5. For ETH, pull matching indexed native transfers from existing TanStack DB
   collections and normalize to the same event shape.
6. Store normalized events in TanStack DB collections.
7. Optionally enrich with bridge metadata from relevant indexers.
8. Query TanStack DB for the selected time range and normalize into a single
   list: `{ fromAddress, toAddress, amount, timestamp, chainId, symbol }`.
9. Build node set: unique `fromAddress` and `toAddress`.
10. Build edges: group by `(fromAddress, toAddress)` (and optionally chainId);
    sum amounts; keep list of timestamps for staggering.
11. Pass nodes and edges to the Threlte scene; render nodes and edges with
    volume and time-staggered animation.

## Acceptance criteria

- [x] Route `/coin/[symbol]` exists and renders the visualization for supported
      symbols.
- [x] Supported symbols at launch: **USDC** and **ETH**.
- [x] Time period selector offers: 1h, 6h, 12h, 1d, 3d, 7d.
- [x] Transfers/bridges for the selected period are derived from TanStack DB
      collections sourced by existing APIs (Voltaire/indexers).
- [x] Unique actor addresses are rendered as nodes; flows are rendered as edges.
- [x] Chain information is reflected in the visualization.
- [x] Errors (e.g. RPC down, no data) are handled with `<svelte:boundary>` and a
      clear message.

## Implementation notes

- Use `src/constants/coins` to resolve coins by symbol.
- Reuse `src/routes/explore/usdc/LiveTransfers.svelte` if compatible; otherwise
  create a minimal coin-aware wrapper.
- Keep Threlte scene minimal (nodes as meshes or points, edges as lines or
  tubes; optional instancing for many nodes/edges).

## Status

Complete. Route `src/routes/coin/[symbol]/+page.svelte` with load validation for
USDC/ETH; transfer-graphs collection keyed by (symbol, period); fetchTransferGraph(symbol, period)
with USDC from Voltaire, ETH empty graph; TIME_PERIODS 1h–7d; LiveTransfers reused with Coin prop;
Boundary for errors; GraphScene updated for symbol+period $id. Re-verification 2026-02-05 (PROMPT_build): all 7 acceptance criteria confirmed (route, USDC/ETH, period selector 1h–7d, TanStack DB/Voltaire, nodes/edges, chain in viz, svelte:boundary); test:unit passed.

## Output when complete

`DONE`
