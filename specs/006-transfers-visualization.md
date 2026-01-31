# Spec 006: Transfers page and LiveTransfers visualization

A `/transfers` page with a Threlte-based visualization of token transfer flows
between actor addresses within a configurable time period, driven by an indexer
API.

## Indexer API (USDC transfers on and across supported chains)

**Recommended: Covalent**

- **Docs:** https://docs.covalenthq.com/ (API Reference, Authentication)
- **Base URL:** `https://api.covalenthq.com/v1/`
- **Relevant endpoint:** Transfers for an address (use USDC contract as address
  to get all USDC transfers on that chain):
  `GET /v1/{chain_id}/address/{contract_address}/transfers/`. Use query params
  (e.g. block range or date) for time-bounded fetches; see Covalent API
  reference for exact parameters.
- **Coverage:** 200+ chains including Ethereum, Polygon, Arbitrum, Base,
  Optimism, Avalanche, Celo, Linea, ZkSync Era and testnets. Covers all
  project-supported chains with USDC.
- **Free tier:** Free API key; rate limit ~5 req/s; sufficient for per-chain,
  per–time-window fetches.
- **Use:** For each supported chain, call the transfers endpoint with the
  chain’s USDC contract address and the chosen time window (1h, 6h, 12h, 1d, 3d,
  7d). Aggregate results to get all USDC transfers (and thus bridge/transfer
  events) across chains in that period.

**Circle CCTP:** Circle’s API (e.g. “Get a list of messages”) is keyed by
`sourceDomainId` + `transactionHash`, so it is suitable for attestation/lookup
of a known CCTP tx, not for listing all transfers in a time range. Use Covalent
(or similar) for time-range listing; use Circle when resolving a specific CCTP
message.

## Page and component

- **Route:** `src/routes/transfers/+page.svelte` — `/transfers`
- **Component:** `src/routes/transfers/LiveTransfers.svelte`
  - **Props:** `coin: Coin` (e.g. USDC on a given chain; used to resolve
    contract address and symbol for the indexer and label).
  - **Behavior:**
    - Time period selector: 1h, 6h, 12h, 1d, 3d, 7d.
    - For the selected period, fetch all transfer/bridge events from the indexer
      for the given coin across all supported chains (using the coin’s contract
      address per chain or the canonical USDC addresses from constants).
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
3. For each supported chain that has the given coin (USDC), call the indexer’s
   token-transfers endpoint for that chain + coin contract + time range.
4. Normalize events into a single list:
   `{ fromAddress, toAddress, amount, timestamp, chainId }`.
5. Build node set: unique `fromAddress` and `toAddress` (optionally keyed by
   `chainId` if showing per-chain actors).
6. Build edges: group by `(fromAddress, toAddress)` (and optionally chainId);
   sum amounts; keep list of timestamps for staggering.
7. Pass nodes and edges to the Threlte scene; render nodes and edges with volume
   and time-staggered animation.

## Acceptance criteria

- [ ] Route `/transfers` exists and renders `LiveTransfers` with a `Coin` prop
      (e.g. USDC from project constants).
- [ ] Time period selector offers: 1h, 6h, 12h, 1d, 3d, 7d.
- [ ] Transfers for the selected period are fetched from Covalent (or agreed
      indexer) for USDC on all supported chains.
- [ ] Unique actor addresses from the fetched events are rendered as nodes in a
      Threlte visualization.
- [ ] Flows between actors are shown as edges; volume (amount) is represented
      (e.g. thickness or label).
- [ ] Edges are staggered or animated according to transfer timestamps within
      the period.
- [ ] Chain information is reflected (e.g. node or edge color/label by chain).
- [ ] Errors (e.g. indexer down, no data) are handled with `<svelte:boundary>`
      and a clear message.

## Implementation notes

- Add Covalent API key to env (e.g. `COVALENT_API_KEY`); use in server-side or
  client-side fetch with key not exposed unnecessarily.
- Reuse `networks` / `ChainId` and USDC contract addresses from `src/constants`
  (coins/tokens) to build per-chain requests.
- Threlte: use `@threlte/core` (and if needed `@threlte/extras`); keep scene
  minimal (nodes as meshes or points, edges as lines or tubes; optional
  instancing for many nodes/edges).
- If Covalent’s exact endpoint or pagination differs from the above, adapt the
  fetch logic in a single module (e.g. `src/lib/transfers-indexer.ts`) so the
  rest of the spec holds.

## Status

Not started.

## Output when complete

`DONE`
