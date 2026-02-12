# Spec 063: Network/Block/Transaction/Trace/Event components

Implement network browsing components built on `details` + `ItemsList`, with
placeholder-aware data structures and TanStack DB-backed routes. Use semantic
HTML and component primitives from `src/styles/components.css`. Do not add
loading or caching beyond what is described here. Set `id` attributes to enable
anchor hash links.

## Scope

- Components: `<Network>`, `<Block>`, `<Transaction>`, `<Trace>`, `<Event>`
- Each component uses `<details>` for disclosure and `<ItemsList>` for lists.
- Undefined `Map` keys represent placeholder items in the UI structure.
- All list items must include stable `id` attributes for hash links.

### Network component

Accept props:
- `data: Map<Network | undefined, Map<Block | undefined, Set<Transaction>>>`
- `placeholderBlockIds?: Set<number | [number, number]>`

Behavior:
- Show network metadata (name, chainId, type, native currency).
- Render an `<ItemsList>` of `<Block>` items.
- `placeholderBlockIds` defaults to the range `[0, height]` where `height` is
  the current network height (subscribed via Voltaire).
- `undefined` network/block keys are rendered as placeholders.

### Block component

Accept props:
- `data: Map<Block | undefined, Set<Transaction>>`

Behavior:
- Show block metadata: number, hash, parentHash, timestamp (relative + ISO),
  miner, gasUsed/gasLimit (with % utilization), baseFeePerGas (in Gwei),
  transaction count.
- Render an `<ItemsList>` of `<Transaction>` items keyed by `transactionIndex`.
- `placeholderTransactionIds` defaults to range `[0, numberOfTransactions]`
  when block is known.
- If block is unknown, use a network-specific average transaction count. Defined
  in `src/constants/networks` as `averageTransactionsPerBlockByChainId`:
  Ethereum 180, Optimism 80, Arbitrum 100, Polygon 120, Base 60, Linea 40,
  EthereumSepolia 30, ArbitrumSepolia 20, BaseSepolia 15 (default 150).
- On `<details>` open (`ontoggle`), if transactions haven't been fetched,
  calls `fetchBlockTransactions(chainId, blockNumber)` which fetches tx hashes
  via `getBlockTransactionHashes` then upserts each via `fetchChainTransaction`.

### Transaction component

Accept props:
- `data: Map<Transaction | undefined, { trace?: Trace, events?: EvmLog[] }>`

Behavior:
- Show transaction metadata: hash (linked to explorer), status (success/fail),
  block number, type (Legacy/EIP-2930/EIP-1559/EIP-4844), nonce, from, to
  (or contract creation), value (formatted ETH), gas limit, gas used,
  gas price (Gwei), effective gas price, input data preview (selector + byte count).
- Render `<Trace>` (if present).
- Render an `<ItemsList>` of `<Event>` (imported as `EventView` to avoid
  shadowing the DOM `Event` type) items.
- `placeholderEventIds` uses the event count from the transaction's logs.
- On `<details>` open (`ontoggle`), if receipt data isn't resolved
  (`status` is null), calls `fetchChainTransaction(chainId, txHash)` to
  fetch full tx + receipt data.

### Trace component

Behavior:
- Render trace metadata: call type (CALL/DELEGATECALL/CREATE/etc.), from, to,
  value (ETH), gas, gasUsed, input (selector + byte count), output, error.
- Recursively render child traces using self-import (`import Self from ...`).
- Fetched via `debug_traceTransaction` with `callTracer` (returns null if unsupported).

### Event component

Behavior:
- Render event metadata: log index (parsed from hex), address, all topics
  (individually listed), data with byte count.

## Data types

### BlockEntry (`src/data/Block.ts`)
- `$id: { chainId, blockNumber }`
- `number`, `hash?`, `parentHash?`, `timestamp`, `miner?`
- `gasUsed?`, `gasLimit?`, `baseFeePerGas?`, `transactionCount?`

### ChainTransactionEntry (`src/data/ChainTransaction.ts`)
- `$id: { chainId, txHash }`
- `blockNumber`, `blockHash`, `transactionIndex?`
- `from`, `to`, `value`, `nonce?`, `input?`
- `gas?`, `gasPrice?`, `type?`
- `status?`, `gasUsed?`, `contractAddress?`, `effectiveGasPrice?`
- `logs: EvmLog[]`

### Trace (`src/data/Trace.ts`)
- `index`, `type?`, `from?`, `to?`, `value?`
- `gas?`, `gasUsed?`, `input?`, `output?`, `error?`
- `children?: Trace[]`

## Voltaire API additions (`src/api/voltaire.ts`)

- `EvmLog` (renamed from `EthLog`)
- `EvmBlock` (renamed from `EthBlock`) with hash, parentHash, miner, gasUsed, gasLimit, baseFeePerGas
- `EvmTransaction` (renamed from `EthTransaction`) expanded with nonce, input, transactionIndex, type
- `EvmTransactionReceipt` (renamed from `EthTransactionReceipt`) expanded with status, gasUsed, contractAddress, effectiveGasPrice
- `debugTraceTransaction(provider, hash)` → `RawTrace | null` (callTracer, graceful fallback)

## Formatting utilities (`src/lib/format.ts`)

- `formatWei(value)` — hex Wei string or bigint → ETH display
- `formatGas(value)` — bigint → locale-grouped number
- `formatGwei(wei)` — Wei bigint → Gwei display

## Routes

Routes use segment `[name]` (network slug or CAIP-2); `+page.ts` resolves
`name` to `chainId` via `parseNetworkNameParam`. See spec 060.

### `/network/[name]`

- Resolve `name` to `chainId`; read current block height via Voltaire.
- Fetch-upsert blocks for range `[height - 10, height]`.
- Use `$effect` to trigger subsequent queries + inserts for all
  `visiblePlaceholderKeys`.
- Display `<Network>` with:
  - `data`: network + all blocks available in the TanStack DB `blocks` collection.

### `/network/[name]/block/[blockNumber]`

- Initialize by fetch-upserting the block.
- Display `<Network>` with:
  - `data`: network + the block.
  - `placeholderBlockIds`: `blockNumber - 1` and
    `min(blockNumber + 1, networkHeight)`.
- Show a "Show Context" link to `/network/[name]#block:[blockNumber]`.

### `/network/[name]/block/[blockNumber]/transaction/[transactionId]`

- Initialize by fetch-upserting the transaction and block in parallel.
- Display `<Network>` with:
  - `data`: network + the block + the transaction.
  - `placeholderBlockIds`: `blockNumber - 1` and
    `min(blockNumber + 1, networkHeight)` (use `blockNumber = 0` if loading).
- Show a "Show Context" link to
  `/network/[name]/block/[blockNumber]#transaction:[transactionId]`.

### `/network/[name]/transaction/[transactionId]`

- Initialize by fetch-upserting the transaction, then the block derived from the
  transaction's block number/hash.
- Display `<Network>` with:
  - `data`: network + the block + the transaction.
  - `placeholderBlockIds`: `blockNumber - 1` and
    `min(blockNumber + 1, networkHeight)` (use `blockNumber = 0` if loading).
- Show a "Show Context" link to
  `/network/[name]/block/[blockNumber]#transaction:[transactionId]`.

## Acceptance criteria

- [x] Components `<Network>`, `<Block>`, `<Transaction>`, `<Trace>`, and `<Event>`
  are implemented using `<details>` and `<ItemsList>`.
- [x] `Map` keys set to `undefined` render as placeholders.
- [x] `<Network>` renders metadata and a list of `<Block>` items with
  `placeholderBlockIds` defaulting to `[0, height]`.
- [x] `<Block>` renders metadata (hash, parentHash, miner, gas, baseFee, timestamp)
  and a list of `<Transaction>` items with `placeholderTransactionIds` defaulting
  to a block's transaction count, or to network-specific averages when unknown.
- [x] `<Transaction>` renders metadata (status, type, nonce, gas, value in ETH,
  input data), a `<Trace>` section, and a list of `<Event>` items.
- [x] `<Trace>` renders recursively for child traces with call type, from/to,
  value, gas, input/output, error.
- [x] `<Event>` renders log index (decimal), address, individual topics, data
  with byte count.
- [x] `/network/[name]` resolves name to chainId, reads current height, upserts
  blocks in `[height - 10, height]`, and uses `$effect` to query/insert visible
  placeholder keys.
- [x] `/network/[name]/block/[blockNumber]` upserts the block, displays
  `<Network>` with `placeholderBlockIds` for adjacent blocks, and includes a
  "Show Context" link to `/network/[name]#block:[blockNumber]`.
- [x] `/network/[name]/block/[blockNumber]/transaction/[transactionId]` upserts
  transaction + block in parallel, displays `<Network>` with adjacent
  `placeholderBlockIds`, and includes a "Show Context" link to
  `/network/[name]/block/[blockNumber]#transaction:[transactionId]`.
- [x] `/network/[name]/transaction/[transactionId]` upserts transaction then
  block, displays `<Network>` with adjacent `placeholderBlockIds`, and includes
  a "Show Context" link to
  `/network/[name]/block/[blockNumber]#transaction:[transactionId]`.
- [x] Semantic HTML is used, and component primitives from
  `src/styles/components.css` are leveraged.
- [x] Anchor hash links work via `id` attributes on list items.
- [x] `ItemsList` `isPlaceholder` discriminant is correct (true = placeholder,
  false = real item with data).
- [x] `bind:visiblePlaceholderKeys` uses correct prop name in all consumers.
- [x] Route pages use `ChainId` type for `data.chainId` (no implicit `any`).
- [x] Component imports don't collide with type imports (NetworkView alias,
  EventView alias).
- [x] `Eth*` types renamed to `Evm*` (`EvmLog`, `EvmBlock`, `EvmTransaction`,
  `EvmTransactionReceipt`) across `voltaire.ts` and all consumers.
- [x] `<Block>` `<details>` triggers `fetchBlockTransactions` on open
  (lazy-loads transactions via `getBlockTransactionHashes` → `fetchChainTransaction`).
- [x] `<Transaction>` `<details>` triggers `fetchChainTransaction` on open
  when receipt data is unresolved.
- [x] `fetchBlockTransactions(chainId, blockNumber)` added to
  `src/collections/blocks.ts`.

## Status

Complete. 2026-02-05: Enriched block data (hash, parentHash, miner, gasUsed,
gasLimit, baseFeePerGas), transaction data (nonce, input, transactionIndex,
gas, gasPrice, type, status, gasUsed, contractAddress, effectiveGasPrice),
trace data (type, from, to, value, gas, gasUsed, input, output, error).
Added `debugTraceTransaction` to Voltaire API. Added formatting utilities
(formatWei, formatGas, formatGwei). Fixed `isPlaceholder` inversion bug in
ItemsList. Fixed `bind:visiblePlaceholderKeys` prop name mismatches. Fixed
`type Network` / `<Network>` component naming conflict in routes. Fixed
`ChainId` type narrowing in route props. Replaced deprecated `<svelte:self>`.
Renamed `Eth*` types to `Evm*`. Added lazy-loading `<details>` toggles:
`<Block>` fetches transactions on open, `<Transaction>` fetches receipt on open.
Build passes.

## TODOs

- (Addressed by Spec 089: Transaction traces, events, and verified sources.)

## Output when complete

`DONE`
