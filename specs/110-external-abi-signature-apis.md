# Spec 110: External ABI and signature lookup APIs

Integrate all external APIs used for contract ABI and selector/signature lookups in `src/api`, following existing codebase conventions. Data consumed by UI or routes must be cached per Spec 065.

## References

- Spec 002 (TanStack DB collections), Spec 065 (external API cache and live-query-only reads)
- [Sourcify API](https://docs.sourcify.dev/docs/api/) — Contract lookup (verified source + ABI); [Swagger](https://sourcify.dev/server/api-docs/swagger.json)
- [Etherscan Contracts API](https://docs.etherscan.io/api-endpoints/contracts) — Get Contract ABI (`module=contract&action=getabi`)
- [Blockscout RPC API](https://docs.blockscout.com/devs/apis/rpc/contract) — Contract ABI/source; [Get source code](https://docs.blockscout.com/api-reference/contract/get-contract-source-code-for-verified-contract) (`module=contract&action=getabi` or `getsourcecode`)
- [OpenChain Signature Database](https://openchain.xyz/) — Selector → text signature (formerly sig.eth.samczsun.com); API: `GET https://api.openchain.xyz/signature-database/v1/lookup?function={hex4}&event={hex32}`
- [4byte.directory API](https://www.4byte.directory/docs/) — Function/event signatures; `GET https://www.4byte.directory/api/v1/signatures/?hex_signature={hex4}` and `.../event-signatures/?hex_signature={hex32}`

## Definitions

- **ABI lookup**: Fetch contract ABI by chain + address (Sourcify, Etherscan, Blockscout).
- **Signature lookup**: Resolve 4-byte function selector or 32-byte event topic to human-readable text signature (OpenChain, 4byte).

## Codebase conventions (src/api)

- Top-of-file JSDoc with official docs URL.
- Base URL in a `const`; build query/path in fetch.
- Exported types for request/response shapes; normalize at API boundary.
- `ChainId` from `$/constants/networks.ts`; address as `0x${string}`.
- `fetch()`; on `!res.ok` return `null` or throw per use-case (e.g. `null` for “not found”, throw for transport/config).
- No API keys in source; accept optional key via parameter or env when required (Etherscan, Blockscout).
- Spec 065: any external data that feeds UI or route logic must be written into a TanStack DB collection and read via live queries; normalization at collection boundary.

## API reference (crawled docs)

### 1. Sourcify (existing)

| Item | Value |
|------|--------|
| Base | `https://sourcify.dev/server` (configurable) |
| Contract lookup | `GET /v2/contract/{chainId}/{address}?fields=...` |
| Fields | `abi`, `abi,sources,compilation`, `sources,compilation`, or `all` |
| Response | `abi` (array), `sources` (path → content), `compilation` (language, compilerVersion, fullyQualifiedName) |
| Docs | https://docs.sourcify.dev/docs/api/ |

Existing module: `src/api/sourcify.ts` — `fetchContractWithAbi`, `fetchContractFull`, `fetchVerifiedContract`.

### 2. Etherscan (getabi)

| Item | Value |
|------|--------|
| Base | Per-chain (same as `contract-discovery.ts`: e.g. `https://api.etherscan.io/api`, `https://api.basescan.org/api`); [supported chains](https://docs.etherscan.io/supported-chains) |
| Endpoint | `GET {base}?module=contract&action=getabi&address={address}` (chain implied by base; add `chainid` only if required by docs for a given chain) |
| API key | Optional query `apikey=...`; higher rate limits with key |
| Success | `status: "1"`, `result` = JSON string of ABI array |
| Not found / error | `status: "0"`, `message`, `result` (string or null) |
| Docs | https://docs.etherscan.io/api-endpoints/contracts#get-contract-abi |

### 3. Blockscout (getabi / getsourcecode)

| Item | Value |
|------|--------|
| Base | Per-instance (e.g. `https://eth.blockscout.com/api`, `https://base.blockscout.com/api`) |
| Get ABI | `GET {base}?module=contract&action=getabi&address={address}` |
| Get source | `GET {base}?module=contract&action=getsourcecode&address={address}` — returns `ABI` (string), `SourceCode`, `ContractName`, etc. |
| API key | Optional `apikey=...`; 5 req/s without, 10 req/s with key |
| Success (getabi) | `status: "1"`, `result` = JSON string of ABI array (Etherscan-compatible; same as Etherscan getabi) |
| Success (getsourcecode) | `result` array with one object containing `ABI` (string), `SourceCode`, etc. |
| Docs | https://docs.blockscout.com/devs/apis/rpc/contract, https://docs.blockscout.com/api-reference/contract/get-contract-source-code-for-verified-contract |

### 4. OpenChain signature lookup

| Item | Value |
|------|--------|
| Base | `https://api.openchain.xyz/signature-database/v1` |
| Lookup | `GET /lookup?function={hex4}&event={hex32}` — both query params optional; at least one required |
| Function | 4-byte selector, e.g. `0xa9059cbb` |
| Event | 32-byte topic hash (no 0x or with 0x) |
| Response | `{ ok: true, result: { function: { "0x...": [{ name: "transfer(address,uint256)", ... }] }, event: { ... } } }`; `ok: false` on error |
| Docs | https://openchain.xyz/ (API implied by usage; no separate doc page) |

### 5. 4byte.directory

| Item | Value |
|------|--------|
| Base | `https://www.4byte.directory/api/v1` |
| Function signatures | `GET /signatures/?hex_signature={hex4}` — exact 4 bytes; `0x` optional; returns paginated `{ results: [ { id, text_signature, hex_signature, bytes_signature } ] }` |
| Event signatures | `GET /event-signatures/?hex_signature={hex32}` — same shape |
| Auth | None |
| Docs | https://www.4byte.directory/docs/ |

## Implementation

### Sourcify (`src/api/sourcify.ts`)

- Keep existing: `SOURCIFY_SERVER`, `fetchContractWithAbi`, `fetchContractFull`, `fetchVerifiedContract`.
- Optionally: allow configurable server URL (e.g. env or parameter) for staging/self-host; default remains `https://sourcify.dev/server`.
- JSDoc already references https://docs.sourcify.dev/docs/api/.

### Etherscan ABI (`src/api/etherscan.ts` — new)

- **Module**: `src/api/etherscan.ts`.
- **Docs ref**: https://docs.etherscan.io/api-endpoints/contracts.
- **Chain → base URL**: Use `getExplorerApiUrl(chainId)` from `$/api/contract-discovery.ts`. That module already has the per-chain Etherscan-style API base; do not duplicate the map. If `getExplorerApiUrl(chainId)` returns `null`, return `null` without fetching.
- **Export**: `fetchAbiFromEtherscan(chainId: ChainId, address: \`0x${string}\`, options?: { apiKey?: string }): Promise<ContractAbi | null>`.
- **Behavior**: GET `{base}?module=contract&action=getabi&address={address}` (+ optional `apikey`). If `status === '1'` and `result` is a non-empty string, parse `JSON.parse(result)` and return as `ContractAbi`; otherwise return `null`. Normalize ABI shape to match `ContractAbi` (array of ABI items).
- **Types**: Export minimal response type for raw API (e.g. `{ status: string; message: string; result?: string }`).

### Blockscout ABI (`src/api/blockscout.ts` — new)

- **Module**: `src/api/blockscout.ts`.
- **Docs ref**: https://docs.blockscout.com/devs/apis/rpc/contract.
- **Chain → base URL**: New map `BLOCKSCOUT_API_BY_CHAIN: Partial<Record<ChainId, string>>` in this module for chains that have a Blockscout instance (e.g. Ethereum, Base, Gnosis, Optimism — from Blockscout docs). Only include chains the app supports. If `BLOCKSCOUT_API_BY_CHAIN[chainId]` is undefined, return `null` without fetching.
- **Export**: `fetchAbiFromBlockscout(chainId: ChainId, address: \`0x${string}\`, options?: { apiKey?: string }): Promise<ContractAbi | null>`.
- **Behavior**: GET `{base}?module=contract&action=getabi&address={address}` (+ optional `apikey`). Blockscout getabi is Etherscan-compatible: `result` is a JSON string of the ABI array. If `status === '1'` and `result` is a non-empty string, parse `JSON.parse(result)` and return as `ContractAbi`; otherwise return `null`.
- **Types**: Raw response type same as Etherscan: `{ status: string; message: string; result?: string }`.

### OpenChain signatures (`src/api/openchain.ts` — new)

- **Module**: `src/api/openchain.ts`.
- **Base**: `https://api.openchain.xyz/signature-database/v1`.
- **Exports**:
  - `fetchFunctionSignatures(selector: \`0x${string}\`): Promise<string[]>` — GET `/lookup?function={selector}`; return `result.function[selector]?.map(e => e.name) ?? []`; normalize selector to 4-byte hex with 0x.
  - `fetchEventSignatures(topicHash: \`0x${string}\`): Promise<string[]>` — GET `/lookup?event={topicHash}`; return `result.event[topicHash]?.map(e => e.name) ?? []`.
  - Optional: single `fetchSignatures({ function?: \`0x${string}\`, event?: \`0x${string}\` })` returning `{ functions: string[], events: string[] }`.
- **Behavior**: On `!res.ok` or `!json.ok` return empty arrays. No API key. Normalize selector/topic to lowercase hex with `0x` so response key lookup matches (OpenChain returns keys like `"0xa9059cbb"`).
- **Caching**: Signature data is cached in the SelectorSignatures collection; the collection layer calls these fetch functions and upserts (see TanStack DB section).

### 4byte signatures (`src/api/fourbyte.ts` — new)

- **Module**: `src/api/fourbyte.ts`.
- **Docs ref**: https://www.4byte.directory/docs/.
- **Base**: `https://www.4byte.directory/api/v1`.
- **Exports**:
  - `fetchFunctionSignatures(selector: \`0x${string}\`): Promise<string[]>` — GET `/signatures/?hex_signature={selector}` (exact 4 bytes); return `results.map(r => r.text_signature)`.
  - `fetchEventSignatures(topicHash: \`0x${string}\`): Promise<string[]>` — GET `/event-signatures/?hex_signature={topicHash}`; same.
- **Behavior**: Normalize selector to 4-byte hex (with 0x); topic to 32-byte. On `!res.ok` return `[]`. Pagination: use first page only unless spec later requires full list.
- **Types**: Response type with `results: { text_signature: string }[]`.

## TanStack DB collections, schemas, and local persistence

Per Spec 065 and Spec 002, external API data consumed by UI is stored in TanStack DB collections and read via live queries. Persistence uses `localStorageCollectionOptions` with `devalue` parser (same pattern as Contracts, VerifiedContractSources).

### 1. Contracts collection (existing — extended)

- **Purpose**: Single source of truth for contract ABI (and optional deployer) per chain + address. Already used by contract view and ContractAction.
- **Data type**: `ContractEntry` in `src/data/Contract.ts`.
- **Schema** (existing; extend `source`):
  - `$id: { $network: { chainId }, address }`
  - `deployer?: \`0x${string}\``
  - `source?: DataSource` — use the existing `DataSource` enum from `$/constants/data-sources.ts`; add `Etherscan = 'Etherscan'` and `Blockscout = 'Blockscout'` to that enum (Sourcify already exists). Only these three values are ever set by `fetchContract`.
  - `abi?: ContractAbi`
- **Collection**: `contractsCollection` in `src/collections/Contracts.ts`.
- **Persistence**: `localStorageCollectionOptions({ id: CollectionId.Contracts, storageKey: CollectionId.Contracts, getKey, parser: { stringify, parse } })`. `getKey(row) = \`${row.$id.$network.chainId}:${row.$id.address}\``.
- **Fetch flow**: In `fetchContract`: (1) Call `fetchContractFull(chainId, address)` (Sourcify) as today. (2) If `full` is non-null, update VerifiedContractSources from `full.source` (existing behavior; do this whether or not `full.abi` is set). If `full.abi` is set, update contract row with `draft.abi = full.abi`, `draft.source = DataSource.Sourcify`, and return. (3) If we still have no ABI (full was null or full.abi undefined), call `fetchAbiFromEtherscan(chainId, address, options)`. If non-null ABI, update contract row with `draft.abi` and `draft.source = DataSource.Etherscan`; return. (4) Else call `fetchAbiFromBlockscout(chainId, address, options)`. If non-null ABI, update contract row with `draft.abi` and `draft.source = DataSource.Blockscout`. (5) Do not create or update VerifiedContractSources when ABI comes from Etherscan or Blockscout (VerifiedContractSources is Sourcify-only for source files). When full is null, existing code already inserts a notFound VerifiedContractSource row; keep that. Normalization: parse API response into `ContractAbi`; set `source` to the corresponding `DataSource` (Sourcify, Etherscan, or Blockscout).
- **Registration**: `CollectionId.Contracts` already in `src/constants/collections.ts`. Contracts is not in `PROFILE_SCOPED_STORAGE_KEYS` (profile.ts); it is a global cache. No change to profile.ts for Contracts.

### 2. SelectorSignatures collection (new)

- **Purpose**: Cache function selector (4-byte) and event topic (32-byte) → human-readable signatures from OpenChain and 4byte. Used by calldata/decoder UI so selector/topic lookups are read via live query and persisted across sessions.
- **Data type**: New `src/data/SelectorSignature.ts`.
  - `SelectorKind` enum: `Function = 'function'`, `Event = 'event'` (string enum for stable getKey and serialization).
  - `SelectorSignature$Id = { kind: SelectorKind, hex: \`0x${string}\` }` — `hex` is 4-byte for function, 32-byte for event (with 0x).
  - `SelectorSignatureEntry = { $id: SelectorSignature$Id, signatures: string[] }` — `signatures` is the list of text signatures (e.g. `transfer(address,uint256)`).
- **Collection**: New `src/collections/SelectorSignatures.ts`.
  - `getKey(row) = \`${row.$id.kind}:${row.$id.hex}\`` (stable, unique per kind+hex; `kind` is enum value so string `'function'` or `'event'`).
  - `selectorSignaturesCollection = createCollection(localStorageCollectionOptions({ id: CollectionId.SelectorSignatures, storageKey: CollectionId.SelectorSignatures, getKey, parser: { stringify, parse } }))`.
- **Persistence**: Same as Contracts — localStorage under `CollectionId.SelectorSignatures`; `devalue` for serialization.
- **Fetch flow**: `ensureFunctionSignatures(selector)` and `ensureEventSignatures(topicHash)` (or single `ensureSelectorSignatures(kind: SelectorKind, hex)`):
  - If collection already has a row for the key (`SelectorKind.Function` or `SelectorKind.Event` plus hex), skip fetch.
  - Else call OpenChain and 4byte (both) for that selector/topic, merge and dedupe the two result arrays, then `insert` normalized entry.
  - Normalization: `signatures` = sorted unique array of strings; hex normalized to lowercase with `0x` prefix.
- **Registration**: Add `SelectorSignatures = 'SelectorSignatures'` to `CollectionId` in `src/constants/collections.ts`. `collectionEntries` is derived from `Object.values(CollectionId)`, so the new collection is included automatically for any flow that iterates collection IDs.

### 3. Constants and registration checklist

- **`src/constants/collections.ts`**: Add `SelectorSignatures = 'SelectorSignatures'` to `CollectionId` enum.
- **`src/constants/data-sources.ts`**: Add `Etherscan = 'Etherscan'` and `Blockscout = 'Blockscout'` to `DataSource` enum.
- **`src/data/Contract.ts`**: Type `source` as `DataSource` (optional). Existing Sourcify usage becomes `DataSource.Sourcify`; new fallbacks use `DataSource.Etherscan`, `DataSource.Blockscout`.
- **`src/data/SelectorSignature.ts`**: New file; export `SelectorKind` enum, `SelectorSignature$Id`, `SelectorSignatureEntry`.
- **`src/collections/Contracts.ts`**: Update `fetchContract` to try Etherscan then Blockscout when Sourcify returns no ABI; set `draft.source` (DataSource) and `draft.abi` from the winning provider.
- **`src/collections/SelectorSignatures.ts`**: New file; collection + `ensureFunctionSignatures(selector)`, `ensureEventSignatures(topicHash)` (or single `ensureSelectorSignatures(kind: SelectorKind, hex)`), calling `fetchFunctionSignatures` / `fetchEventSignatures` from openchain and fourbyte, merge/dedupe, upsert.

### 4. Profile / backup

- Profile export (`src/lib/profile.ts`) uses a fixed list `PROFILE_SCOPED_STORAGE_KEYS` (CollectionId values and `ROOM_PERSISTENT_PEER_ID_STORAGE_KEY`). Only those keys are exported/restored per profile. Contracts and VerifiedContractSources are not in that list (they are global caches). SelectorSignatures is the same: add `CollectionId.SelectorSignatures` to the enum only; do not add it to `PROFILE_SCOPED_STORAGE_KEYS` unless the product decision is to make signature cache profile-scoped. No change to profile.ts required for this spec.

## ABI source precedence (for contract ABI resolution)

When resolving ABI for a contract (e.g. in Contracts collection or calldata decoder):

1. Sourcify (existing) — no key, multi-chain.
2. Etherscan getabi — optional key, chain-specific base.
3. Blockscout getabi — optional key, chain-specific base.

Order is configurable (e.g. Sourcify first, then Etherscan, then Blockscout). Contract entry `source` is set to `DataSource.Sourcify`, `DataSource.Etherscan`, or `DataSource.Blockscout` when ABI is fetched from that provider (see Spec 090).

## Spec 065 alignment

- **ABI data** that feeds UI (e.g. contract view, calldata decoder) must be written into the Contracts collection and read via live queries. The fetch functions in `sourcify.ts`, `etherscan.ts`, and `blockscout.ts` are called only from the collection layer (`fetchContract` in Contracts.ts); the collection normalizes and upserts.
- **Signature lookups** (OpenChain, 4byte): Results are written into the SelectorSignatures collection and read via live queries. The fetch functions in `openchain.ts` and `fourbyte.ts` are called only from the collection layer (`ensureFunctionSignatures` / `ensureEventSignatures` in SelectorSignatures.ts); the collection merges both sources, dedupes, and upserts.

## Acceptance criteria

**API modules**

- [ ] `src/api/sourcify.ts` unchanged in contract (or only extended with optional configurable server); JSDoc references Sourcify API docs.
- [ ] `src/api/etherscan.ts` exists; exports `fetchAbiFromEtherscan(chainId, address, options?)`; uses `getExplorerApiUrl(chainId)` from `contract-discovery.ts` for base URL (returns null when chain not supported); GET getabi; returns `ContractAbi | null`; JSDoc links to Etherscan contracts API docs.
- [ ] `src/api/blockscout.ts` exists; exports `fetchAbiFromBlockscout(chainId, address, options?)`; uses `BLOCKSCOUT_API_BY_CHAIN`; GET getabi; returns `ContractAbi | null`; JSDoc links to Blockscout contract API docs.
- [ ] `src/api/openchain.ts` exists; exports `fetchFunctionSignatures(selector)` and `fetchEventSignatures(topicHash)` (and optionally combined); uses OpenChain lookup URL; returns string arrays; JSDoc references OpenChain.
- [ ] `src/api/fourbyte.ts` exists; exports `fetchFunctionSignatures(selector)` and `fetchEventSignatures(topicHash)`; uses 4byte API; returns string arrays; JSDoc links to 4byte.directory docs.
- [ ] All new API modules use `ChainId` and `0x${string}` where applicable; no API keys hardcoded; optional keys via parameter (or env) for Etherscan/Blockscout.

**TanStack DB: schemas and data types**

- [ ] `src/constants/data-sources.ts`: `DataSource` enum includes `Etherscan` and `Blockscout`.
- [ ] `src/data/Contract.ts`: `source` typed as `DataSource` (optional).
- [ ] `src/data/SelectorSignature.ts` exists; exports `SelectorKind` enum (Function, Event), `SelectorSignature$Id` (`kind: SelectorKind`, `hex`), and `SelectorSignatureEntry` (`$id`, `signatures: string[]`).

**TanStack DB: collections and persistence**

- [ ] `CollectionId.SelectorSignatures` added in `src/constants/collections.ts`.
- [ ] `src/collections/SelectorSignatures.ts` exists; `selectorSignaturesCollection` created with `localStorageCollectionOptions` (id + storageKey = `CollectionId.SelectorSignatures`, getKey = `kind:hex` using `SelectorKind`, parser = devalue); exports `ensureFunctionSignatures(selector)` and `ensureEventSignatures(topicHash)` (or `ensureSelectorSignatures(kind: SelectorKind, hex)`) that fetch from OpenChain + 4byte, merge/dedupe, and upsert.
- [ ] `src/collections/Contracts.ts`: `fetchContract` tries Sourcify then Etherscan then Blockscout when resolving ABI; sets `source` and `abi` from the provider that returns an ABI; updates VerifiedContractSources only when Sourcify returns (not when ABI comes from Etherscan/Blockscout); persistence unchanged (localStorage, existing getKey).

**Tests and Spec 065**

- [ ] Unit tests (or integration tests) for at least one fetch per new API module (e.g. mock fetch or live call with known address/selector) to verify shape and null/empty behavior.
- [ ] Spec 065: ABI used by UI is read via `contractsCollection` and live query; signature lookups used by UI are read via `selectorSignaturesCollection` and live query (ensure* writes, components use `useLiveQuery`).

## Status

In progress.
