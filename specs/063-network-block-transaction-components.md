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
- Show network metadata.
- Render an `<ItemsList>` of `<Block>` items.
- `placeholderBlockIds` defaults to the range `[0, height]` where `height` is
  the current network height (subscribed via Voltaire).
- `undefined` network/block keys are rendered as placeholders.

### Block component

Accept props:
- `data: Map<Block | undefined, Set<Transaction>>`

Behavior:
- Show block metadata.
- Render an `<ItemsList>` of `<Transaction>` items.
- `placeholderTransactionIds` defaults to range `[0, numberOfTransactions]`
  when block is known.
- If block is unknown, use a network-specific average transaction count. Define
  guessimates in `src/constants/networks` based on research.

### Transaction component

Accept props:
- `data: Map<Transaction | undefined, { trace?: Trace, events?: Event[] }>`

Behavior:
- Show transaction metadata.
- Render `<Trace>` (if present).
- Render an `<ItemsList>` of `<Event>` items.
- `placeholderEventIds` uses the `placeholderTraceIds` set described by the
  transaction’s trace metadata.

### Trace component

Behavior:
- Render trace metadata.
- Recursively render child traces using nested `<Trace>`.

### Event component

Behavior:
- Render event metadata.

## Routes

### `/network/[chainId]`

- Initialize by reading current block height via Voltaire.
- Fetch-upsert blocks for range `[height - 10, height]`.
- Use `$effect` to trigger subsequent queries + inserts for all
  `visiblePlaceholderKeys`.
- Display `<Network>` with:
  - `data`: network + all blocks available in the TanStack DB `blocks` collection.

### `/network/[chainId]/block/[blockId]`

- Initialize by fetch-upserting the block.
- Display `<Network>` with:
  - `data`: network + the block.
  - `placeholderBlockIds`: `blockNumber - 1` and
    `min(blockNumber + 1, networkHeight)`.
- Show a "Show Context" link to `/network/[chainId]#block:[blockId]`.

### `/network/[chainId]/block/[blockId]/transaction/[transactionId]`

- Initialize by fetch-upserting the transaction and block in parallel.
- Display `<Network>` with:
  - `data`: network + the block + the transaction.
  - `placeholderBlockIds`: `blockNumber - 1` and
    `min(blockNumber + 1, networkHeight)` (use `blockNumber = 0` if loading).
- Show a "Show Context" link to
  `/network/[chainId]/block/[blockId]#transaction:[transactionId]`.

### `/network/[chainId]/transaction/[transactionId]`

- Initialize by fetch-upserting the transaction, then the block derived from the
  transaction’s block number/hash.
- Display `<Network>` with:
  - `data`: network + the block + the transaction.
  - `placeholderBlockIds`: `blockNumber - 1` and
    `min(blockNumber + 1, networkHeight)` (use `blockNumber = 0` if loading).
- Show a "Show Context" link to
  `/network/[chainId]/block/[blockId]#transaction:[transactionId]`.

## Acceptance criteria

- [ ] Components `<Network>`, `<Block>`, `<Transaction>`, `<Trace>`, and `<Event>`
  are implemented using `<details>` and `<ItemsList>`.
- [ ] `Map` keys set to `undefined` render as placeholders.
- [ ] `<Network>` renders metadata and a list of `<Block>` items with
  `placeholderBlockIds` defaulting to `[0, height]`.
- [ ] `<Block>` renders metadata and a list of `<Transaction>` items with
  `placeholderTransactionIds` defaulting to a block’s transaction count, or to
  network-specific averages when unknown.
- [ ] `<Transaction>` renders metadata, a `<Trace>` section, and a list of
  `<Event>` items using placeholder IDs derived from trace metadata.
- [ ] `<Trace>` renders recursively for child traces.
- [ ] `/network/[chainId]` reads current height, upserts blocks in
  `[height - 10, height]`, and uses `$effect` to query/insert visible placeholder
  keys.
- [ ] `/network/[chainId]/block/[blockId]` upserts the block, displays
  `<Network>` with `placeholderBlockIds` for adjacent blocks, and includes a
  "Show Context" link to `/network/[chainId]#block:[blockId]`.
- [ ] `/network/[chainId]/block/[blockId]/transaction/[transactionId]` upserts
  transaction + block in parallel, displays `<Network>` with adjacent
  `placeholderBlockIds`, and includes a "Show Context" link to
  `/network/[chainId]/block/[blockId]#transaction:[transactionId]`.
- [ ] `/network/[chainId]/transaction/[transactionId]` upserts transaction then
  block, displays `<Network>` with adjacent `placeholderBlockIds`, and includes
  a "Show Context" link to
  `/network/[chainId]/block/[blockId]#transaction:[transactionId]`.
- [ ] Semantic HTML is used, and component primitives from
  `src/styles/components.css` are leveraged.
- [ ] Anchor hash links work via `id` attributes on list items.

## TODOs

- TODO: Define and document network-specific average transaction counts in
  `src/constants/networks` based on research.
- TODO: Specify which trace field should provide `placeholderTraceIds`.

## Output when complete

`DONE`
