# Spec 089: Transaction traces, events, and verified contract sources

Extend network/block/transaction pages with detailed traces (RPC `debug_traceTransaction`),
decoded events when ABI is available, progressive detail levels (Summary → Detailed → Exhaustive),
and verified smart contract sources from Sourcify on address pages. Reuse existing views
(`Trace.svelte`, `Event.svelte`, `EntityView`, `EntityList`). Cache all external fetches
in TanStack DB per Spec 065. TEVM simulation output remains the source for draft sessions
(Spec 049); this spec covers on-chain data and Sourcify.

## Scope

1. **Traces:** Fetch via RPC `debug_traceTransaction`, cache in `TransactionTraces` collection, display in Transaction view.
2. **Events:** Raw logs from receipt (existing); decoded logs when Voltaire ABI registry has entry for log address.
3. **Detail levels:** Summary / Detailed / Exhaustive with progressive disclosure.
4. **Verified sources:** Sourcify API for contract addresses; display on account/address entity pages.
5. **Data sources:** Add `Sourcify` to DataSource enum; label RPC, Sourcify, TEVM where applicable.

## Non-goals

- Replacing TEVM simulation flow for draft sessions.
- Block explorer API fallbacks for traces (RPC only; show "Trace unavailable" when unsupported).
- Full ABI decoding infrastructure (use Voltaire ABI when available; raw fallback).

## Data types

### TransactionTraceEntry (`src/data/TransactionTrace.ts`)

- `$id: { chainId: ChainId, txHash: \`0x${string}\` }`
- `trace: Trace` (normalized from RawTrace)
- `$source: DataSource.Voltaire`

### VerifiedContractSourceEntry (`src/data/VerifiedContractSource.ts`)

- `$id: { chainId: ChainId, address: \`0x${string}\` }`
- `metadata?: { compiler, language, sources }
- `files: Record<string, string>` (path → source)
- `$source: DataSource.Sourcify`

## Collections

### TransactionTraces (`src/collections/TransactionTraces.ts`)

- `transactionTracesCollection`: localStorage-backed, key `chainId:txHash`.
- `fetchTransactionTrace(chainId, txHash)` → calls `debugTraceTransaction`, normalizes RawTrace → Trace, upserts.
- On Transaction `<details>` open, if trace missing, call `fetchTransactionTrace`.

### VerifiedContractSources (`src/collections/VerifiedContractSources.ts`)

- `verifiedContractSourcesCollection`: localStorage-backed, key `chainId:address`.
- `fetchVerifiedContractSource(chainId, address)` → GET Sourcify `/server/v2/contract/{chainId}/{address}`, upserts.
- On address page when address may be contract, call fetch; show "Verified Source" section when match.

## API additions

### `src/api/voltaire.ts`

- `rawTraceToTrace(raw: RawTrace, index?: number): Trace` — map calls → children, add index.

### `src/api/sourcify.ts` (new)

- `fetchVerifiedContract(chainId: number, address: \`0x${string}\`): Promise<VerifiedContractSourceEntry | null>`
- Uses `https://sourcify.dev/server/v2/contract/{chainId}/{address}?fields=all` (or minimal fields).

## Component updates

### Transaction.svelte

- Accept `trace?: Trace | null` in data (null = unavailable; undefined = not yet fetched).
- On `<details>` open: if trace undefined, call `fetchTransactionTrace`; show "Trace unavailable" when null.
- Progressive detail: Summary (default, metadata only) → expand "Detailed" (events) → expand "Exhaustive" (trace + all events).
- Use nested `<details>` for Summary / Detailed / Exhaustive sections.

### Event.svelte

- Accept optional `decoded?: { name: string; args: Record<string, unknown> }`.
- When decoded present: show event name + args; keep raw topics/data in collapsible fallback.
- When decoded absent: current behavior (raw only).

### Account/address page

- When displaying an address, optionally call `fetchVerifiedContractSource` (e.g. when balance/tx suggests contract).
- Add "Verified Source" section with collapsible source viewer when Sourcify returns match.
- Show data source label (Sourcify).
- Syntax highlighting for .sol source via @speed-highlight/core (js grammar for Solidity).

## Voltaire ABI for event decoding

- Use Voltaire/contract ABI when available to decode logs. If no ABI: raw display only.
- Event decoding: match topics[0] to event signatures; decode data with ABI types.
- Defer full ABI registry integration if not present; spec allows raw-only initially with TODO for decoded.

## Acceptance criteria

- [x] `TransactionTraces` collection exists; `fetchTransactionTrace` calls `debugTraceTransaction` and upserts.
- [x] Transaction `<details>` open triggers trace fetch when trace undefined; result shown via Trace.svelte.
- [x] When RPC returns null (unsupported): show "Trace unavailable" (no error throw).
- [x] Transaction has Summary (metadata) / Detailed (events) / Exhaustive (trace + all events) via progressive disclosure.
- [x] Event view shows decoded name + args when `decoded` prop provided; raw fallback otherwise.
- [x] `Sourcify` added to DataSource enum.
- [x] `VerifiedContractSources` collection exists; `fetchVerifiedContractSource` calls Sourcify API and upserts.
- [x] Account/address page shows "Verified Source" section when Sourcify returns verified contract.
- [x] Data source labels (Voltaire, Sourcify) shown where applicable.

## Status

Complete. TransactionTraces collection + fetch; Transaction trace fetch on details open, Trace.svelte display, "Trace unavailable" fallback; progressive detail levels (Summary, Detailed: Events, Exhaustive: Trace); Event decoded prop support; Sourcify DataSource; VerifiedContractSources + fetchVerifiedContractSource; VerifiedContractSource view on account page; DataSource labels in VerifiedContractSource.

## Output when complete

`DONE`
