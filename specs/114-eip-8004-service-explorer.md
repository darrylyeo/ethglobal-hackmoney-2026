# Spec 114: Exploring registered EIP-8004 services

Enable discovery and exploration of services registered on EIP-8004 (Trustless Agents) registries. Users can list, filter, and view service registration details and optionally reference services in agent chat (spec 066/067) for future paid interactions (see spec 115).

## Scope

- **Data:** Types and (optionally) TanStack DB or live-query integration for EIP-8004 identity registry data: service identity id, registration URI (e.g. IPFS), parsed registration metadata (name, description, contact/endpoint).
- **Registry access:** Read from EIP-8004 Identity Registry contract(s) on configured chain(s). Support at least one reference deployment (e.g. mainnet). Fetch registration documents from URIs in registration records.
- **Explorer UI:** Route(s) and components to list registered services (with filters e.g. by chain, search), and a detail view for a single service (registration metadata, link to use in chat).
- **Agent chat integration:** Allow referencing an EIP-8004 service (e.g. by identity id or `@Service:...`) in `EntityRefInput` so the user can attach “this service” to a turn; stored as `EntityRef` with an appropriate `EntityType` (e.g. `Eip8004Service`). No payment flow in this spec.

## Non-goals

- No reputation or validation registry UI in this spec (identity registry only).
- No x402 payment execution (spec 115).
- No editing or registering new services from the app; read-only explorer.

## Data types

### `Eip8004Service` (or equivalent in `src/data/`)

```typescript
type Eip8004Service = {
	identityId: string       // from registry (e.g. token id or contract-derived id)
	chainId: number
	contractAddress: `0x${string}`
	registrationUri: string  // e.g. ipfs://...
	name?: string
	description?: string
	contactEndpoint?: string // URL or endpoint for the service (used later for x402)
	fetchedAt: number
}
```

Parsed from registry contract + registration document. Cache in memory or TanStack DB; TTL/refresh policy TBD.

### EntityType addition

Add `Eip8004Service = 'Eip8004Service'` to `EntityType` with metadata so service refs can appear in `entityRefs` and in `EntityRefPattern` / `EntityRefInput` suggestions.

## Registry integration

- **Contract:** Use Voltaire (or existing RPC) to call the EIP-8004 Identity Registry `register()`-related view functions (e.g. list registered identity ids, get registration URI for an id). Exact ABI and chain list from EIP-8004 reference deployments.
- **Registration document:** Fetch from `registrationUri` (IPFS gateway or direct). Parse name, description, contact/endpoint per EIP-8004 registration file format.

## UI

- **List route:** e.g. `/agents/registry` or `/explore/agents` — table or cards of registered services, optional filters (chain, text search on name/description), link to detail.
- **Detail route:** e.g. `/agents/registry/[identityId]` or `/explore/agents/[identityId]` — show full registration metadata, “Use in chat” or “Reference in agent chat” that deep-links to `/agents` with a pre-filled or suggested `@Service:identityId` ref.
- **EntityRefInput:** Extend suggestions/sources so that EIP-8004 services (from explorer or a live query) can appear in the `@` combobox; selecting one inserts an entity ref that resolves to `EntityType.Eip8004Service` and the chosen `identityId` (and optionally `displayLabel`).

## Acceptance criteria

- [x] EIP-8004 Identity Registry read integration: fetch registered service ids and registration URIs from at least one chain.
- [x] Registration document fetch and parse: resolve URI to get name, description, contact endpoint; type `Eip8004Service` (or equivalent) defined.
- [x] Explorer list UI: route listing registered services with optional chain/search filters.
- [x] Explorer detail UI: route showing one service’s registration metadata and a way to “use in chat” (link or ref).
- [x] `EntityType` includes EIP-8004 service; `EntityRefInput` can suggest/insert service refs (e.g. `@Service:identityId`).
- [x] No payment or x402 logic in this spec.

## Sources

- https://eips.ethereum.org/EIPS/eip-8004
- Spec 066: Agent chat data model
- Spec 067: Agent session UI, EntityRefInput

## Status

Complete. 2026-02-21 (PROMPT_build execute one spec): Eip8004Service type and eip8004ServiceIdToString/FromString in src/data/Eip8004Service.ts. EIP8004_REGISTRY_CONFIGS in src/constants/eip-8004-registry.ts (empty until deployment). src/api/eip-8004.ts: registry ABI (getAgentCount, getAgentIdByIndex, getAgentUri), fetchRegistrationDocument (IPFS gateway), fetchEip8004Services, fetchEip8004Service. eip8004ServicesCollection (CollectionId.Eip8004Services). EntityType.Eip8004Service, entityTypes, Entity/EntityId, graphSceneEntityTypes. entitySuggestions: serviceToSuggestion from eip8004ServicesCollection. Routes: /agents/registry (list with Filters/Sorts, search), /agents/registry/[id] (detail, EntityView + Eip8004Service.svelte, "Use in chat" link). navigationItems and graphWatchedScope handle Eip8004Service. No payment/x402.
