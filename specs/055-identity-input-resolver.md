# Spec 055: Identity input + resolver

Define a dedicated identity input pipeline backed by schema types, constants,
and TanStack DB collections. Resolution uses Voltaire for on-chain lookups and
stores normalized identity data for reuse.

## Scope

- Add `IdentityResolution` + `IdentityResolver` schema types alongside supporting
  enums/constants.
- Introduce a TanStack DB collection for identity resolution records.
- Normalize raw user identity input into a typed, canonical form stored with the
  resolution record.
- Resolve identities using Voltaire for on-chain reads and ABI calls.
- Cache resolved identity data in collections for downstream use.

## Non-goals

- UI redesign for identity entry components.
- Supporting non-EVM name systems.
- Automatic wallet connection or signing.

## Definitions

### Identity resolution

A user-provided identity string (address or name) normalized into a typed
record, plus the latest resolved identity payload.

### Identity resolver

A resolver configuration that describes which identity kinds can be resolved on
which chains, and how to translate normalized input into resolved identity data.

## Data model sketch

```typescript
enum IdentityInputKind {
	Address = 'Address',
	EnsName = 'EnsName',
	EnsText = 'EnsText',
}

enum IdentityResolutionStatus {
	Idle = 'Idle',
	Resolving = 'Resolving',
	Resolved = 'Resolved',
	Error = 'Error',
}

type IdentityResolution = {
	id: string
	raw: string
	normalized: string
	kind: IdentityInputKind
	chainId?: ChainId
	resolverId?: string
	createdAt: number
	updatedAt: number
	resolvedAt?: number
	address?: `0x${string}`
	interopAddress?: string
	name?: string
	textRecords?: Record<string, string>
	avatarUrl?: string
	source: DataSource
}

type IdentityResolver = {
	id: string
	kind: IdentityInputKind
	chainId: ChainId
	source: DataSource
	ensRegistry?: `0x${string}`
	ensUniversalResolver?: `0x${string}`
	textRecordKeys?: string[]
}
```

## Resolution flow

- Parse `IdentityResolution.raw` into a normalized `kind` + `normalized` string.
- Select a matching `IdentityResolver` (by `kind` + `chainId`).
- Use Voltaire for all chain reads (registry lookup, resolver calls, and text
  records).
- Persist results into the identity resolution collection.
- Use TanStack DB query/mutation state to track `loading`/`error` for resolution.

## Acceptance criteria

### Schema + constants

- [x] `IdentityResolution` and `IdentityResolver` types exist in
  `src/constants/`.
- [x] A constants module exports the canonical `IdentityInputKind` list and a
  resolver array for supported chains, with derived `byId` / `byKind` indices.
- [x] Resolver constants include ENS registry + universal resolver addresses
  where applicable.

### TanStack DB collections

- [x] `identity-resolution` collection stores normalized input and resolved
  identity payloads.
- [x] Collection entries include `$source` and `chainId` where applicable.

### Voltaire integration

- [x] Identity resolution uses Voltaire RPC + ABI calls (no ethers/viem).
- [x] ENS name resolution supports forward resolution to address and at least
  one text record (e.g. `avatar`), using the universal resolver when configured.
- [x] Address inputs support reverse lookup to name when a resolver is
  configured.
- [x] Resolution UI state uses TanStack DB query/mutation state (no persisted
  status/error fields on the resolution entity).

## TODOs

- TODO: Confirm which chains should ship with resolver config on day one.
- TODO: Decide the default text record keys to resolve (avatar, url, twitter).

## Status

Complete. `src/constants/identity-resolver.ts`: IdentityResolution, IdentityResolver, IdentityInputKind, IdentityResolutionStatus, IDENTITY_INPUT_KINDS, identityResolvers, identityResolversById, identityResolversByKind; ENS registry + universal resolver for Ethereum. `src/collections/identity-resolution.ts`: identity-resolution collection with $source and chainId. `src/api/identity-resolve.ts`: normalizeIdentity, resolveEnsForward, resolveEnsReverse, resolveIdentity using Voltaire only (Ens namehash, encodeFunction/decodeParameters, eth_call). Unit tests in `src/api/identity-resolve.spec.ts`.

## Output when complete

`DONE`
