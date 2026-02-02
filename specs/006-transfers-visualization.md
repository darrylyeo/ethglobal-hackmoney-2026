# Spec 006: Transfers page and LiveTransfers visualization

A `/transfers` page with a Threlte-based visualization of USDC transfer flows
between actor addresses within a configurable time period. Data comes from
TanStack DB collections backed by Ethereum JSON-RPC log filters (Voltaire) and
bridge indexers for enrichment.

## Data sources (USDC transfers on supported networks)

**Primary source: JSON-RPC event filters (Voltaire)**

- Use `eth_getLogs` with the USDC `Transfer(address,address,uint256)` event
  signature per supported network.
- Build filters by `fromBlock`/`toBlock` derived from the selected time window
  (resolve block numbers by timestamp).
- Voltaire handles ABI/event signatures and RPC plumbing.

**Bridge indexers (for enrichment only)**

- Use relevant indexers to map transfer events to bridge-specific metadata
  (CCTP, canonical bridges, etc.) when available.
- Indexers are not the source of truth for transfer listing; they only enrich
  transfer edges with bridge context.

## Page and component

- **Route:** `src/routes/transfers/+page.svelte` — `/transfers`
- **Component:** `src/routes/transfers/LiveTransfers.svelte`
  - **Props:** `coin: Coin` (USDC only; used to resolve contract addresses and
    symbol for labels).
  - **Behavior:**
    - Time period selector: 1h, 6h, 12h, 1d, 3d, 7d.
    - For the selected period, query TanStack DB collections that are populated
      from JSON-RPC logs for the given coin across all supported chains.
    - From the fetched events, derive **unique actor addresses** (from/to or
      equivalent) and treat them as **nodes**.
    - **Edges:** flows of “coins” between two actor addresses. Volume = sum of
      amounts for that (from, to) pair in the window; optionally retain
      per-transfer timestamps for staggering.
    - Render a **Threlte** 3D (or 2D) visualization:
      - Nodes: one per unique actor (e.g. position by layout or chain).
      - Edges: represent transfer volume between nodes; animate or stagger by
        transfer timestamp so that flows appear over time within the window.
    - Account for **amounts** (e.g. edge thickness or label) and **chains**
      (e.g. node color or label by source/destination chain).

## Data flow

1. User selects time period (1h, 6h, 12h, 1d, 3d, 7d).
2. Map period to a time range (e.g. `[now - period, now]`).
3. Resolve per-chain `fromBlock`/`toBlock` for the time range using block
   timestamps.
4. For each supported chain that has USDC, fetch logs via Voltaire with
   `eth_getLogs` using the USDC contract + Transfer event topic.
5. Store normalized events in TanStack DB collections.
6. Optionally enrich with bridge metadata from relevant indexers (CCTP, etc.)
   using transaction hashes.
7. Query TanStack DB for the selected time range and normalize into a single
   list:
   `{ fromAddress, toAddress, amount, timestamp, chainId }`.
8. Build node set: unique `fromAddress` and `toAddress` (optionally keyed by
   `chainId` if showing per-chain actors).
9. Build edges: group by `(fromAddress, toAddress)` (and optionally chainId);
   sum amounts; keep list of timestamps for staggering.
10. Pass nodes and edges to the Threlte scene; render nodes and edges with volume
   and time-staggered animation.

## Acceptance criteria

- [ ] Route `/transfers` exists and renders `LiveTransfers` with a `Coin` prop
      (USDC only from project constants).
- [ ] Time period selector offers: 1h, 6h, 12h, 1d, 3d, 7d.
- [ ] Transfers for the selected period are derived from JSON-RPC `eth_getLogs`
      for USDC Transfer events on all supported networks.
- [ ] TanStack DB collections store normalized transfer events and serve the
      query results for the selected period.
- [ ] Bridge indexers are used to enrich transfer events with bridge metadata
      when available (non-blocking).
- [ ] Unique actor addresses from the fetched events are rendered as nodes in a
      Threlte visualization.
- [ ] Flows between actors are shown as edges; volume (amount) is represented
      (e.g. thickness or label).
- [ ] Edges are staggered or animated according to transfer timestamps within
      the period.
- [ ] Chain information is reflected (e.g. node or edge color/label by chain).
- [ ] Errors (e.g. RPC down, no data) are handled with `<svelte:boundary>` and a
      clear message.

## Implementation notes

- Use `src/constants/networks` and USDC contract addresses to define supported
  networks (USDC only to start).
- Use Voltaire for ABI and JSON-RPC calls, including `eth_getLogs`.
- Resolve `fromBlock`/`toBlock` by timestamp per chain (binary search by
  `eth_getBlockByNumber` timestamp).
- Use TanStack DB collections for transfer events and any derived aggregates.
- Keep Threlte scene minimal (nodes as meshes or points, edges as lines or
  tubes; optional instancing for many nodes/edges).

## TODOs

- TODO: Define USDC-only supported network list for transfers collection.
- TODO: Document bridge indexers used for enrichment.

## Status

Incomplete.

## Output when complete

`DONE`
