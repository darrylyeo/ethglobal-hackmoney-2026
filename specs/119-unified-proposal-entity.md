# 119 – Unified Proposal entity / schema

**Implementation note:** Current code uses `ProposalRealm` enum (Ethereum | ChainAgnostic) in `src/lib/proposal-paths.ts`; list and single-proposal pages use it for realm filter and paths.

## Current state

**Two separate types and entity types**

| Aspect | ProposalEntry (Ethereum) | CaipEntry (chain-agnostic) |
|--------|--------------------------|----------------------------|
| **Data** | `src/data/ProposalEntry.ts` | `src/data/CaipEntry.ts` |
| **EntityType** | `EntityType.Proposal` | `EntityType.Caip` |
| **Collection** | `CollectionId.Proposals`, `proposalsCollection` | `CollectionId.Caips`, `caipsCollection` |
| **Entity ID** | `ProposalEntry$Id` = `{ id: string }` (e.g. `eip-1`, `erc-20`) | `CaipEntry$Id` = `{ id: string }` (e.g. `caip-1`) |
| **Slug** | `eip-{n}` / `erc-{n}` | `caip-{n}` |
| **Discriminator** | `type: ProposalType` (Eip \| Erc) | none (realm = chain-agnostic implies CAIP) |
| **Common fields** | number, title, status, url, $source | number, title, status, type (string), url, $source |
| **Ethereum-only** | category (Core, Networking, …) | — |
| **View** | `Proposal.svelte` (eips.ethereum.org link) | `Caip.svelte` (chainagnostic.org link) |

**Where the split hurts**

- List page: `ProposalListItem = { realm: ProposalRealm; entry: ProposalEntry \| CaipEntry }` with casts in branches.
- Single page: two branches (`proposalEntry` vs `caipEntry`), two EntityViews, two metadata shapes, duplicated layout.
- Paths: `getProposalPath(realm, entry)` and `proposalSlug(entry)` need `Pick<ProposalEntry, …> | Pick<CaipEntry, …>`.
- EntityType: two entity types for what is conceptually “a standards proposal” (realm + kind distinguish).

---

## Unified schema options

### Option A – Single `Proposal` type with discriminated `realm` + `kind`

One entity type, one row shape, one collection (or two collections with same row type).

```ts
// Discriminator: realm + kind
export enum ProposalRealm {
  Ethereum = 'ethereum',
  ChainAgnostic = 'chain-agnostic',
}

// For Ethereum: Eip | Erc. For CAIP: single kind.
export type ProposalKind = ProposalType | 'caip'   // ProposalType = Eip | Erc

export type Proposal$Id = { id: string }  // eip-N | erc-N | caip-N (slug)

export type Proposal = {
  $id: Proposal$Id
  realm: ProposalRealm
  kind: ProposalKind
  number: number
  title: string
  status: string
  url: string
  $source: DataSource
  /** Ethereum-only: Core, Networking, Interface, ERC, Meta, Informational */
  category?: string
  /** Ethereum: EIP/ERC; CAIP: Standard, Meta, Informational (string) */
  type: ProposalType | string
}
```

- **EntityType**: drop `EntityType.Caip`; use a single `EntityType.Proposal`. `Entity` and `EntityId` maps have one slot for Proposal.
- **ID**: `id` is the slug (`eip-1`, `erc-20`, `caip-1`). Parsing stays in `parseProposalSlug`; no need for realm in ID if slug is globally unique.
- **Paths**: `getProposalPath(realm, proposal)` and `proposalSlug(proposal)` take a single `Proposal` (or `Pick<Proposal, 'realm'|'kind'|'number'>`).
- **Collections**: either
  - **A1** One collection “Proposals” with `getKey: (row) => row.$id.id`, fed by two fetch functions (EIPs/ERCs + CAIPs) that normalize into `Proposal`, or
  - **A2** Keep two collections (Proposals, Caips) but both store rows of type `Proposal` (realm + kind set at fetch time).
- **UI**: one list item type `Proposal`, one detail layout; metadata and “View on …” link branch on `proposal.realm` (and optionally `proposal.kind`).

### Option B – Keep two row types, single EntityType and shared base type

Minimal change: introduce a shared base and keep two collections/row types.

```ts
export type ProposalBase = {
  number: number
  title: string
  status: string
  url: string
  $source: DataSource
}

export type ProposalEntry = ProposalBase & {
  type: ProposalType
  category: string
  // realm implied Ethereum
}

export type CaipEntry = ProposalBase & {
  type: string  // Standard, Meta, Informational
  // realm implied ChainAgnostic
}

export type Proposal = ProposalEntry | CaipEntry  // union for “any proposal”
```

- **EntityType**: keep only `EntityType.Proposal`. `Entity[EntityType.Proposal]` = `Proposal` (union). `EntityId[EntityType.Proposal]` = `{ id: string }` (slug). Remove `EntityType.Caip` and all `CaipEntry`-specific entity mappings.
- **Paths**: `getProposalPath(realm, entry)` and `proposalSlug(entry)` accept `Proposal`; realm can be derived from `'type' in entry && (entry.type === ProposalType.Erc || entry.type === ProposalType.Eip)` vs else (CAIP).
- **Collections**: still two (Proposals, Caips); list page still merges two queries but items are typed as `Proposal`; single page loads one of two collections by realm and renders one EntityView with `entityType={EntityType.Proposal}`, branching only for metadata and link (by realm / kind).
- **UI**: one `EntityView` + one “Proposal detail” component that takes `Proposal` and branches internally for annotation and external link.

### Option C – Single collection, single type, single fetch (full unification)

One `Proposal` type (as in A), one collection, one “fetch all proposals” that calls both APIs and normalizes to `Proposal[]`.

- Simplest mental model and one place to query.
- List and detail both consume `Proposal[]` / `Proposal` only.
- Con: two network sources (EIPs+ERCs + CAIPs) and different cache lifecycles might still be handled inside one queryFn (e.g. Promise.all + merge).

---

## Recommendation

- **Short term (minimal breaking change)**: **Option B**  
  - Add `ProposalBase` and type `Proposal = ProposalEntry | CaipEntry`.  
  - Remove `EntityType.Caip`; use `EntityType.Proposal` for both.  
  - Unify `Entity`/`EntityId` so that Proposal entity = `Proposal`, ID = `{ id: string }` (slug).  
  - Keep two collections; list page keeps two queries but uses `ProposalListItem = { entry: Proposal }` (realm derivable from entry).  
  - Single page: one EntityView, one branch for “Ethereum vs CAIP” only for metadata and “View on …” link.  
  - Path helpers take `Proposal` (or minimal pick) and derive realm from entry shape.

- **Medium term (cleaner model)**: **Option A**  
  - Single `Proposal` type with explicit `realm` and `kind`.  
  - Either one collection (A1) or two collections with same row type (A2).  
  - Single EntityType.Proposal, single list item type, single detail layout with small branches on `realm`/`kind`.  
  - Enables one “proposals” cache and simpler routing (e.g. `/proposals/:slug` with slug globally unique).

---

## Files to touch (for Option B as first step)

- `src/data/ProposalEntry.ts` – add `ProposalBase`, export `Proposal` union (and keep `ProposalEntry` / `CaipEntry`).
- `src/data/CaipEntry.ts` – extend `ProposalBase` (or type `CaipEntry = ProposalBase & { … }`).
- `src/data/$EntityType.ts` – remove `EntityType.Caip`; `Entity[Proposal]` = `Proposal`; `EntityId[Proposal]` = `{ id: string }`; remove Caip from Entity/EntityId maps and entityTypes.
- `src/lib/proposal-paths.ts` – accept `Proposal` (or minimal shape); derive realm from entry.
- `src/routes/proposals/+page.svelte` – list items as `{ entry: Proposal }`; realm from entry; single entity type in EntityView.
- `src/routes/proposals/[realm]/[slug]/+page.svelte` – single EntityView; load entry by realm + slug; metadata/link branch on realm or kind.
- `src/routes/navigationItems.svelte.ts` – Proposal case only (remove Caip if any); href from slug.
- `src/constants/collections.ts` – keep both Proposals and Caips (no change).
- Views: `Proposal.svelte` and `Caip.svelte` can become one `ProposalDetail.svelte` that takes `Proposal` and branches for link text/URL, or keep two small components invoked by branch on `realm`.

If we later move to Option A, we’d add `realm`/`kind` to the type, migrate collections to the new shape, and simplify path/query logic further.
