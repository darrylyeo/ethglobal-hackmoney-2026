# Spec 118: Display all CAIPs (chain-agnostic IPs) using data and links from official sources

Display a list of Chain Agnostic Improvement Proposals (CAIPs) with status and type, using data and canonical links from official sources only. Implemented similarly to Spec 112 (EIP/ERC proposals): cached per Spec 065, same explorer and route pattern with realm **chain-agnostic** and slug **caip-{number}**.

## References

- Spec 002 (TanStack DB collections), Spec 042 (entity data sources), Spec 065 (external API cache and live-query-only reads), Spec 088 (EntityView), Spec 099 (Filters), Spec 105 (Sorts), Spec 112 (EIP/ERC proposals)
- [CAIPs repo](https://github.com/ChainAgnostic/CAIPs) — canonical CAIP repo; [CAIPs directory](https://github.com/ChainAgnostic/CAIPs/tree/main/CAIPs) contains `caip-{n}.md` with YAML frontmatter
- [chainagnostic.org/CAIPs](https://chainagnostic.org/CAIPs/) — official CAIP index and per-CAIP pages
- [CAIP-1](https://chainagnostic.org/CAIPs/caip-1) — CAIP purpose and guidelines (frontmatter: caip, title, status, type, author, created, updated)

## Definitions

- **CAIP**: Chain Agnostic Improvement Proposal. Single entry: number, title, status, type (Standard, Meta, Informational), official URL. Entity type `EntityType.Caip`; data type `CaipEntry`.
- **Official data**: Metadata from ChainAgnostic/CAIPs (e.g. GitHub API or raw markdown frontmatter).
- **Official links**: chainagnostic.org/CAIPs for index and per-CAIP pages (e.g. https://chainagnostic.org/CAIPs/caip-{number}).

## Official link targets

| Resource | URL |
|----------|-----|
| CAIPs index | https://chainagnostic.org/CAIPs/ |
| Single CAIP | https://chainagnostic.org/CAIPs/caip-{number} |
| Repo | https://github.com/ChainAgnostic/CAIPs |

## Status and type values

From CAIP frontmatter (CAIP-1):

- **Status**: Draft, Review, Active, Final, etc. (use values from repo).
- **Type**: Standard, Meta, Informational (stored as `type` or `category`).

## Filters and sorts

Same pattern as Spec 112: Filters (Spec 099) and Sorts (Spec 105).

- **Realm** (when combined with Ethereum proposals): Ethereum (EIP/ERC) | Chain-agnostic (CAIP) | All.
- **Type**: Standard, Meta, Informational.
- **Status**: from frontmatter.
- Sorts: number (asc/desc), title, status, type. Default number asc.

## Data source and implementation

- **DataSource**: `Caips` in `src/constants/data-sources.ts`.
- **Collection**: TanStack DB collection `Caips` (`src/collections/Caips.ts`), keyed by number. Normalize: number, title, status, type/category, url, $source.
- **Data type**: `CaipEntry` and `CaipEntry$Id` in `src/data/CaipEntry.ts`; entity type `EntityType.Caip`.
- **Sync**: Fetch from GitHub (ChainAgnostic/CAIPs, CAIPs/ directory); list files, parse frontmatter from raw markdown. Respect Spec 065: data written into collection; UI reads via live queries only.
- **Routes**: List at `/proposals` with realm filter including "Chain-agnostic"; single CAIP at `/proposals/chain-agnostic/caip-{number}` using EntityView and `Caip.svelte` (link to chainagnostic.org). Realm is `ProposalRealm.ChainAgnostic`; paths from `getProposalPath(ProposalRealm.ChainAgnostic, entry)` in `src/lib/proposal-paths.ts`.

## Acceptance criteria

- [x] DataSource includes `Caips`.
- [x] TanStack DB collection `Caips` stores normalized `CaipEntry`; sync from ChainAgnostic/CAIPs.
- [x] Explorer at `/proposals` can filter by realm "Chain-agnostic" and show CAIPs; single route `/proposals/chain-agnostic/caip-{number}` uses EntityView with `EntityType.Caip`.
- [x] UI shows CAIP number, title, status, type; each entry links to chainagnostic.org/CAIPs/caip-{number}.
- [x] Spec 065: external fetch only in collection/sync layer; UI reads via live query only.

## Status

Complete.
