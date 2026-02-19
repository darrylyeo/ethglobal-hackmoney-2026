# Spec 107: SQD Portal API integration

Integrate SQD Portal as a supported data source for networks, blocks, transactions, events, transfers, and traces. Portal is the streaming HTTP API to query blockchain data from the SQD Network (2,000+ worker nodes). Built for data extraction: block-range queries, native finality/reorg handling, NDJSON streaming.

## Scope

- Add `DataSource.Sqd` to the DataSource enum.
- Implement `src/api/sqd.ts` with: chainId → dataset slug, Portal endpoints (stream, head, metadata), and EVM query client.
- Use SQD Portal as an optional/fallback source for: block headers, transactions, event logs, traces, and transfer events (ERC20 Transfer topic0).
- Cache fetched data in TanStack DB per Spec 065; normalize at the collection boundary.
- Map `ChainId` to SQD dataset slugs from [EVM networks](https://beta.docs.sqd.dev/en/data/networks/evm); include only networks with `portal: true`.

## Non-goals

- Replacing Voltaire as the primary RPC for real-time data, simulation, or single-block/tx lookups.
- Supporting Substrate, Starknet, Solana, or non-EVM datasets.

## SQD Portal API

**Primary source:** [beta.docs.sqd.dev](https://beta.docs.sqd.dev/) (documentation index: [llms.txt](https://beta.docs.sqd.dev/llms.txt))

### Base URL

```
https://portal.sqd.dev/datasets/{dataset-slug}
```

### Endpoints (EVM)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/stream` | POST | Stream blocks matching a data query. NDJSON. Includes real-time when network has `realtime: true`. |
| `/finalized-stream` | POST | Stream finalized blocks only. Handles reorgs as rollback events. Use for production. |
| `/head` | GET | Current chain head block. |
| `/finalized-head` | GET | Latest finalized block. |
| `/metadata` | GET | Dataset metadata: name, aliases, start block, real-time support. |

### Stream request (POST /stream or /finalized-stream)

```json
{
  "type": "evm",
  "fromBlock": 18000000,
  "toBlock": 18001000,
  "fields": {
    "block": { "number": true, "timestamp": true, "hash": true, "gasUsed": true },
    "log": { "address": true, "topics": true, "data": true, "transactionHash": true, "logIndex": true },
    "transaction": { "hash": true, "from": true, "to": true, "value": true, "input": true, "gasUsed": true, "status": true, "contractAddress": true },
    "trace": { "type": true, "callFrom": true, "callTo": true, "callValue": true, "callInput": true, "callResultOutput": true, "callResultGasUsed": true, "error": true, "createFrom": true, "createResultAddress": true },
    "stateDiff": { "address": true, "key": true, "kind": true, "prev": true, "next": true }
  },
  "logs": [{ "address": ["0xa0b8..."], "topic0": ["0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"] }],
  "transactions": [{ "to": ["0x..."], "sighash": ["0xa9059cbb"] }],
  "traces": [{ "type": ["call"], "callTo": ["0x..."] }],
  "includeAllBlocks": false
}
```

**Trace types:** `call` (staticcall, delegatecall, callcode normalized to call), `create` (deployments). **Trace fields (call):** callFrom, callTo, callValue, callInput, callResultOutput, callResultGasUsed, error. **Trace fields (create):** createFrom, createResultAddress, createResultCode. Address may also appear as `result.address`. **stateDiff kind:** `=` unchanged, `+` added, `*` modified, `-` removed. **transaction.contractAddress:** populated for deployments. **ERC20 Transfer topic0:** `0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef`. **transfer(address,uint256) sighash:** `0xa9059cbb`.

| Field | Type | Description |
|-------|------|-------------|
| `type` | string | `"evm"` for EVM datasets. |
| `fromBlock` | number | Start block (inclusive). Required. |
| `toBlock` | number | End block (inclusive). |
| `fields` | object | Field selectors for block, log, transaction, trace, stateDiff. Request only fields needed. |
| `logs` | object[] | Log filters. `{ address?, topic0?, topic1?, topic2?, topic3? }`. topic2 for Transfer "to" = `0x000...000${addr.slice(2)}`. |
| `transactions` | object[] | Tx filters. `{ from?, to?, sighash? }`. |
| `traces` | object[] | Trace filters. `{ type?, callTo?, callFrom? }`. type: `call` or `create`. For factory deployments use `type: ["create"]`, `callFrom: [factoryAddr]`. |
| `stateDiffs` | object[] | State diff filters. `{ address?, key?, kind? }`. key = keccak256(abi.encode(mappingKey, slot)) for mappings. |
| `includeAllBlocks` | boolean? | If false (default), only blocks with matching data. |

### Stream response

NDJSON (newline-delimited JSON). Each line is one block. Use `Accept-Encoding: gzip` or `curl --compressed` for smaller responses.

```json
{"header":{"number":18000000,"timestamp":1697544779,"gasUsed":"12534567"},"transactions":[],"logs":[]}
```

### Access options

| Option | URL | Rate limit | Use case |
|--------|-----|------------|----------|
| Public Portal | `https://portal.sqd.dev` | 20 req/10s | Development, testing |
| Cloud Portal | From SQD Cloud env | Higher limits | Production |
| Self-hosted | `http://<host>:8000` | None | Full control |

### Network coverage

[EVM Networks](https://beta.docs.sqd.dev/en/data/networks/evm) lists all supported networks with:

- `chainId`, `slug`, `portal` (true = available on Portal)
- `traces`, `stateDiffs` — per-network support
- `realtime` — real-time streaming support
- Some L2s (Optimism, Base, Zora, Scroll) support L1 fields (l1Fee, l1BlockNumber) in block/transaction.

Include only networks where `portal: true` in the ChainId → slug mapping.

### Performance tips (from docs)

- Filter by indexed parameters (topic1, topic2, topic3).
- Batch 10k–50k blocks per query.
- Request only needed fields.
- Use specific filters (address, topic0).

## ChainId → dataset mapping

Create `src/constants/sqd-datasets.ts`:

- Map `ChainId` → `{ slug, traces?, stateDiffs? }`. Slug is the dataset identifier for Portal URLs.
- Reference: [EVM Networks](https://beta.docs.sqd.dev/en/data/networks/evm). Use `evmNetworks` entries with `portal: true`.
- Example: Ethereum (1)→`ethereum-mainnet`, Base (8453)→`base-mainnet`, Arbitrum (42161)→`arbitrum-one`, Polygon (137)→`polygon-mainnet`, Optimism (10)→`optimism-mainnet`, Avalanche (43114)→`avalanche-mainnet`, Linea (59144)→`linea-mainnet`, Scroll (534352)→`scroll-mainnet`, BaseSepolia (84532)→`base-sepolia`, EthereumSepolia (11155111)→`ethereum-sepolia`, ArbitrumSepolia (421614)→`arbitrum-sepolia`, etc.

## API module: `src/api/sqd.ts`

- `getSqdDatasetSlug(chainId: ChainId): string | null` — returns slug or null if unsupported.
- `getSqdPortalBaseUrl(chainId: ChainId): string | null` — `https://portal.sqd.dev/datasets/<slug>` or null.
- `fetchSqdHead(chainId: ChainId): Promise<{ number: number }>` — GET `/head`.
- `fetchSqdFinalizedHead(chainId: ChainId): Promise<{ number: number }>` — GET `/finalized-head`.
- `fetchSqdMetadata(chainId: ChainId): Promise<SqdMetadata>` — GET `/metadata`.
- `streamSqdEvm(chainId: ChainId, query: SqdEvmQuery): AsyncGenerator<SqdBlockItem>` — POST `/stream` or `/finalized-stream`, parse JSONL, yield blocks.
- `SqdEvmQuery` — `{ type: 'evm', fromBlock, toBlock, fields, logs?, transactions?, traces?, stateDiffs? }`.
- `SqdBlockItem` — `{ header, transactions?, logs?, traces?, stateDiffs? }`.

For batched reads (non-streaming): collect from generator into array. Paginate by splitting `fromBlock`..`toBlock` into chunks (e.g. 10k blocks).

## Collections and data flow

| Data | Collection | SQD usage |
|------|------------|-----------|
| Blocks | `blocks` (BlockEntry) | `fields: { block: {...} }` with `logs: [{}]` or `transactions: [{}]` to get block headers. Normalize to BlockEntry, `$source: DataSource.Sqd`. |
| Transactions | `NetworkTransactions` (ChainTransactionEntry) | `transactions: [{}]`, `logs: true` for receipt. Normalize to ChainTransactionEntry. |
| Events / Logs | EvmLog | `logs: [{ address?, topic0?, transaction?: true }]`. Normalize to EvmLog. |
| Transfers | `TransferEvents` | `logs: [{ topic0: [ERC20_TRANSFER_TOPIC] }]`. Normalize to NormalizedTransferEvent, `$source: DataSource.Sqd`. |
| Traces | `TransactionTraces` | `traces: [{ transaction: true }]`. Only for networks with `traces: true`. Normalize to Trace. |

Prefer Voltaire for: single-tx lookup, single-block lookup, real-time height, simulation, `eth_call`. Use SQD Portal for: batch historical blocks, transactions, logs, traces, transfer indexing.

## Data types and normalization

- Portal `header` → `BlockEntry`: number, hash, parentHash, timestamp, miner, gasUsed, gasLimit, baseFeePerGas.
- Portal `transaction` → `ChainTransactionEntry`: hash, from, to, value, input, gas, nonce, status, gasUsed, etc.
- Portal `log` → `EvmLog`: address, topics, data, logIndex, transactionHash; link to tx.
- Portal `trace` → `Trace`: call (callFrom, callTo, callValue, callInput, callResultOutput, callResultGasUsed, error), create (createFrom, createResultAddress).
- Addresses in responses are lowercase.

## Acceptance criteria

- [ ] `DataSource.Sqd` added to `src/constants/data-sources.ts`.
- [ ] `src/constants/sqd-datasets.ts` exists with ChainId → slug mapping for Portal-supported networks we use (Ethereum, Base, Arbitrum, Polygon, Optimism, Avalanche, Linea, Scroll, zkSync, Unichain, and testnets).
- [ ] `src/api/sqd.ts` exists with `getSqdDatasetSlug`, `getSqdPortalBaseUrl`, `fetchSqdHead`, `streamSqdEvm`, `SqdEvmQuery`, `SqdBlockItem` types.
- [ ] At least one collection uses SQD Portal as an optional source with normalization and `$source: DataSource.Sqd`.
- [ ] Fetched data is cached in TanStack DB per Spec 065; reads via live queries only.
- [ ] Public Portal rate limit (20 req/10s) respected via client-side throttle.
- [ ] When SQD is unsupported for a chain, fall back to Voltaire; no errors thrown.

## TODOs

- Implement SQD API module and dataset mapping.
- Integrate SQD into TransferEvents or blocks as fallback for batch historical fetches.
- Add trace support only for networks with `traces: true`.

## Sources

- [beta.docs.sqd.dev](https://beta.docs.sqd.dev/) — documentation index
- [llms.txt](https://beta.docs.sqd.dev/llms.txt) — structured doc index
- [Portal Overview](https://beta.docs.sqd.dev/en/portal/overview)
- [EVM Portal Overview](https://beta.docs.sqd.dev/en/portal/evm/overview)
- [EVM Quickstart](https://beta.docs.sqd.dev/en/portal/evm/getting-started-quickstart)
- [Query Logs example](https://beta.docs.sqd.dev/en/portal/evm/examples/query-logs)
- [Query Transactions](https://beta.docs.sqd.dev/en/portal/evm/examples/query-transactions)
- [Query Traces](https://beta.docs.sqd.dev/en/portal/evm/examples/query-traces)
- [State Diffs](https://beta.docs.sqd.dev/en/portal/evm/examples/state-diffs)
- [NFT Transfers](https://beta.docs.sqd.dev/en/portal/evm/examples/nft-transfers)
- [Contract Deployments](https://beta.docs.sqd.dev/en/portal/evm/examples/contract-deployments)
- [DEX Swaps](https://beta.docs.sqd.dev/en/portal/evm/examples/dex-swaps)
- [EVM Networks](https://beta.docs.sqd.dev/en/data/networks/evm)
- [Portal Migration](https://beta.docs.sqd.dev/en/portal/migration)
- [Portal Pricing](https://beta.docs.sqd.dev/en/portal/pricing)
- Spec 042 (entity data sources), Spec 065 (external API cache), Spec 089 (traces, events, Sourcify)

## Status

Draft. Not implemented.

## Output when complete

`DONE`
