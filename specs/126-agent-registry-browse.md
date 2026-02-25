# Spec 126: Browse agents from agent registries

Enable users to browse agents from one or more onchain agent registries (e.g. EIP-8004). List and detail UIs are driven by registry config; each registry has a corresponding entity type, collection, and entity view following established conventions.

## Ecosystem context

- **EIP-8004 (Trustless Agents)** provides a discovery and trust layer for AI agents via three on-chain registries: Identity (ERC-721, agentURI → registration doc), Reputation (feedback), Validation (third-party verification). Co-authors: MetaMask, Ethereum Foundation, Google, Coinbase.
- **8004.org** is the community hub: builder program, get started, community links. **ai.ethereum.foundation** (dAI team) is the EF research home: ERC-8004 project, blog (intro, MCP registration), ZK Usage Credits, ContextMesh; positions Ethereum as the coordination/settlement layer for agents.
- **Explorers** (8004scan.io, agentscan.info, 8004agents.ai, trust8004.xyz) read from the same Identity Registry contract(s) and resolve `agentURI` to registration documents (IPFS/HTTPS/data URI). They do not expose public read APIs for agent lists; our implementation is chain-native (RPC + fetch registration doc) and does not depend on them.
- **Registration document** (agentURI): EIP-8004 and best practices define `name`, `description`, `image`, `services` (MCP, A2A, OASF, agentWallet, etc.), `registrations`, `active`. We parse a minimal subset (name, description, contact/endpoint) for display; full schema refs: best-practices.8004scan.io, Agent0 SDK.

## Scope

- **Constants:** Registry configs live in `src/constants/` (e.g. `eip-8004-registry.ts` per protocol; optional `agent-registries.ts` for browseable registry list used by nav and list page).
- **Entities:** One entity type per registry kind. Each has `$Id` (e.g. `chainId` + `identityId`), id serialization helpers (`*IdToString`, `*IdFromString`), and is registered in `EntityType`, `entityTypes`, `Entity` / `EntityId`, and `graphSceneEntityTypes` (spec 114, 094).
- **Collections:** One TanStack DB collection per registry (e.g. `Eip8004Agents`), with `CollectionId`, `queryFn` that reads from chain (Identity Registry view calls) and registration doc (agentURI), `getKey` from entity id serialization. No dependency on third-party explorer APIs.
- **Entity views:** One view component per agent entity type in `src/views/` (e.g. `Eip8004Agent.svelte`). Detail page uses `EntityView` with the view in the children slot.
- **Routes:** List route (e.g. `/agents/registry`) and detail route (e.g. `/agents/registry/[id]`) with id from URL parsed via entity `*IdFromString`. List uses Filters/Sorts, live query from collection.
- **Navigation:** Watched-entity display uses entity id serialization for href (e.g. `/agents/registry/{id}`). Nav section includes an entry to the agent registry list (e.g. "Agent registry" under Agents).
- **EntityRefInput:** Agent entities appear in `@` suggestions (from collection) and resolve to the correct `EntityType` and `EntityId`.

## Non-goals

- Reputation or validation registry UI (identity only).
- Registering or editing agents from the app (read-only browse).
- x402 payment execution (spec 115).

## Conventions

| Layer | Convention |
|-------|------------|
| **Constants** | Registry config: `label`, `contract` (Contract$Id) or equivalent. Optional `agentRegistries`: `{ id, label, listHref, entityType }[]` for nav/list. |
| **Entity** | `src/data/[EntityName].ts`: type `[EntityName]`, `[EntityName]$Id`, `[entityName]IdToString(id)`, `[entityName]IdFromString(s)`. |
| **EntityType** | Add to enum, `entityTypes`, `Entity`/`EntityId`, `graphSceneEntityTypes`. |
| **Collection** | `CollectionId.[EntityName]s`, `createCollection(queryCollectionOptions({ id, queryKey, queryFn, getKey }))`. |
| **Entity view** | `src/views/[EntityName].svelte`: props for the entity; used inside `EntityView` children on detail page. |
| **List route** | `useLiveQuery` from collection; Filters (e.g. chain); Sorts; search; link each row to detail `/[id]` with serialized id. |
| **Detail route** | Parse `params.id` with `*IdFromString`; resolve entity from collection or fetch; render `EntityView` + entity view. |
| **Watched entity** | In `navigationItems` (or equivalent), `href` = list base + `encodeURIComponent(*IdToString(parsedId))`. |

## Acceptance criteria

- [x] At least one agent registry config in constants (EIP-8004: `eip8004RegistryConfigs`).
- [x] Agent entity type with $Id and id serialization; in EntityType, entityTypes, Entity/EntityId, graphSceneEntityTypes.
- [x] Collection for agent entity with CollectionId, queryFn, getKey; included in `collectionByEntityType` when used by generic entity-type→collection mapping.
- [x] Entity view component for agent; detail page uses EntityView + view in children slot.
- [x] List route with search, filters, sorts; detail route with id parsing and EntityView.
- [x] Nav includes link to agent registry list; watched-entity href uses canonical id serialization.
- [x] EntityRefInput suggests agent entities from collection.

## Sources

- Spec 114: EIP-8004 agent explorer (implementation reference)
- Spec 094: ID serializations
- Spec 042: Entity data sources
- EIP-8004: https://eips.ethereum.org/EIPS/eip-8004
- 8004.org: community hub, builder program, get started
- ai.ethereum.foundation: dAI team, ERC-8004 project, blog (intro, MCP registration)
- Explorer best practices / agent metadata: https://best-practices.8004scan.io/docs/ (sources, agent metadata standard)

## Status

Complete. 2026-02-24: Spec 126 added. Constants: `eip-8004-registry.ts`, `agent-registries.ts` (browseable list). Entity: `Eip8004Agent` / `Eip8004Agent$Id`, id helpers, EntityType, entityTypes, Entity/EntityId, graphSceneEntityTypes. Collection: `Eip8004Agents`, `collectionByEntityType`. View: `Eip8004Agent.svelte`. Routes: `/agents/registry`, `/agents/registry/[id]`. Nav: agent registry list link; watched href via `eip8004AgentIdToString`. EntityRefInput: agent suggestions from collection.
