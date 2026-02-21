# Spec 094: Entity ID serializations – enums, metadata, and helpers

Formalize how entity **identities** are turned into **strings** (URLs, storage keys, drag payloads). Serializations are string formats only; they are **not** IDs. IDs are in-memory types (see spec 092). Do not intermingle: constants hold serialization metadata (enum + label + patterns); helper functions elsewhere perform serialize/id → string and deserialize string → id.

## Goals

- **Single source of truth**: Per-entity enum `[EntityName]$IdSerializationType` lists every allowed serialization format.
- **Discoverable metadata**: One array per entity, `[entityName]$IdSerializations`, whose entries associate each format with `label: string` and `patterns: IdPattern[]`.
- **Plain vs reference**: Serializations may be plain (e.g. `chainId-address`, `slug:address`) or reference formats from EIP/CAIP (e.g. EIP-7930 interop, CAIP-2). Interop addresses fall under reference serializations.
- **Helpers only where used**: Serialize and deserialize logic lives in helper functions at call sites (e.g. route params in `lib/patterns.ts`, `lib/id-serialization.ts`), not in the constants module.

## IDs vs serializations

| Concept | Where | Purpose |
|--------|--------|--------|
| **ID** | `$id: [EntityName]$Id` (spec 092) | In-memory identity; nested refs ($network, $actor, etc.). |
| **Serialization** | String form (e.g. `ethereum`, `eip155:1`, `1-0x…`) | URLs, storage keys, display, drag payloads. |
| **Metadata** | `src/constants/id-serializations.ts` | Enums + arrays (label, patterns) only. No conversion logic. |
| **Convert** | `lib/id-serialization.ts`, `lib/patterns.ts` | `serialize*(id, format)` and `deserialize*(string)` helpers. |

## Existing patterns (reuse)

**`src/constants/patterns.ts`** defines shared input patterns:

- **`PatternType`** enum: `EvmAddress`, `EnsName`, `EvmBlockNumber`, `EvmTransactionHash`, `EntityId`
- **`PatternConfig`**: `{ type, label, placeholder, pattern: RegExp, matchComplexity, isHumanReadable }`
- **`patterns`**: array of configs; **`patternByPatternType`**: map by enum.

Where a serialization format is described by one of these (e.g. decimal chain id ≈ `EvmBlockNumber`, address segment = `EvmAddress`), id-serialization metadata **references** that type instead of redefining a regex.

## Types

- **`IdPattern`**: One of:
  - `{ kind: 'regex'; regex: RegExp; description?: string }` — format-specific
  - `{ kind: 'pattern'; type: PatternType }` — reference `constants/patterns.ts` (same RegExp/label)
  - `{ kind: 'eip' | 'caip'; ref: string; section?: string }` (e.g. `ref: 'EIP-7930'`, `ref: 'CAIP-2'`)
- **`[EntityName]$IdSerializationType`**: Enum of allowed formats for that entity.
- **`[EntityName]$IdSerializationEntry`**: `{ serialization: [EntityName]$IdSerializationType; label: string; patterns: IdPattern[] }`
- **`[entityName]$IdSerializations`**: `readonly [EntityName]$IdSerializationEntry[]` — one entry per enum member, each with `label` and `patterns`.

## Relevant entities and formats

| Entity | Enum | Example formats (label + patterns) |
|--------|------|------------------------------------|
| Network | `Network$IdSerializationType` | ChainId (decimal), Slug (e.g. ethereum), Caip2 (eip155:1) |
| Actor | `Actor$IdSerializationType` | PlainChainAddress (chainId-0x…), InteropEip7930 (EIP-7930) |
| Contract | `Contract$IdSerializationType` | SlugAddress (slug:0x…), ChainIdAddress (chainId:0x…) |
| Block | `Block$IdSerializationType` | ChainIdBlockNumber, SlugBlockNumber |
| Coin | `Coin$IdSerializationType` | PlainChainAddress, InteropEip7930, Symbol (e.g. USDC) |
| ActorCoin | `ActorCoin$IdSerializationType` | Composite (chainId:owner:token), Devalue (stringified $id) |
| ChainTransaction | `ChainTransaction$IdSerializationType` | ChainIdTxHash, SlugTxHash |
| TransactionTrace | `TransactionTrace$IdSerializationType` | Same as ChainTransaction |
| VerifiedContractSource | `VerifiedContractSource$IdSerializationType` | Same as Contract |

Reference formats (EIP-7930, CAIP-2, etc.) use `IdPattern` with `kind: 'eip'` or `kind: 'caip'`. Parsing of interop strings is implemented in `constants/interop.ts` and used by deserialize helpers.

## Helper functions (serialize / deserialize)

Conversion between `$id` and string **must not** live in `constants/id-serializations.ts`. Define helpers where they are used:

| Location | Functions | Use |
|----------|-----------|-----|
| `lib/id-serialization.ts` | `serializeNetworkId(id, format)`, `deserializeNetworkId(value)` | Canonical Network id ↔ string. |
| `lib/patterns.ts` | `parseNetworkNameParam(name)` | Route param `[name]`: uses `deserializeNetworkId` then enriches with config/slug/caip2 for pages. |
| Route params | — | Use the above (e.g. `parseNetworkNameParam` for `/network/[name]`). |
| Other entities | Add `serialize*` / `deserialize*` in `lib/id-serialization.ts` or next to route (e.g. block, contract, tx) when needed. |

Serializers take `($id, format: [Entity]$IdSerializationType)` and return `string`. Deserializers take `string` and return `$id | null` (they may try formats in order).

## Implementation

- **Constants (metadata only)**: `src/constants/id-serializations.ts`
  - Export `IdPattern` type.
  - Per relevant entity: `enum [EntityName]$IdSerializationType`, `const [entityName]$IdSerializations: readonly …[]` with `label` and `patterns`.
  - Optional: derived map `[entityName]$IdSerializationsByType` for lookup by enum (no conversion logic).
- **Helpers**: `src/lib/id-serialization.ts` (and existing `lib/patterns.ts`)
  - Network: `serializeNetworkId(id, format)`, `deserializeNetworkId(value)`.
  - `parseNetworkNameParam` in `lib/patterns.ts` calls `deserializeNetworkId` and builds `ParsedNetworkParam` from network configs.

## Status

Complete. Re-verification 2026-02-21 (PROMPT_build execute one spec): All implementation points confirmed—`src/constants/id-serializations.ts` exports `IdPattern`; per-entity enums and `[entityName]$IdSerializations` arrays (Network, Actor, Contract, Block, Coin, ActorCoin, ChainTransaction, TransactionTrace, VerifiedContractSource) with label and patterns; optional ByType maps; no conversion logic in constants. `src/lib/id-serialization.ts`: `serializeNetworkId(id, format)`, `deserializeNetworkId(value)`. `src/lib/patterns.ts`: `parseNetworkNameParam(name)` uses `deserializeNetworkId` and returns `ParsedNetworkParam`. Route params in `/network/[name]/*` use `parseNetworkNameParam`. Deno test 55 passed; Vitest phase pre-existing failure (npm:@tanstack/svelte-db). Previous: Implemented.
