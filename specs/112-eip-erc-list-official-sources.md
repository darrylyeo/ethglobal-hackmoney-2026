# Spec 112: Display all EIPs/ERCs and their statuses using data and links from official sources

Display a list (or explorable view) of all Ethereum Improvement Proposals (EIPs) and Ethereum Request for Comments (ERCs) with their status and category, using data and canonical links from official sources only. The umbrella term is **Proposal**; each entry has **type** `ProposalType.Eip` or `ProposalType.Erc`. Data consumed by UI must be cached per Spec 065.

## References

- Spec 002 (TanStack DB collections), Spec 042 (entity data sources), Spec 065 (external API cache and live-query-only reads), Spec 088 (EntityView, EntityList), Spec 099 (Filters component), Spec 105 (Sorts component)
- [EIPs status page](https://eips.ethereum.org/) — official status page; [EIP status terms](https://eips.ethereum.org/) (Living, Withdrawn, Stagnant, Final, Last Call, Review, Draft, Idea)
- [EIP categories](https://eips.ethereum.org/): Core, Networking, Interface, ERC, Meta, Informational
- [ethereum/EIPs](https://github.com/ethereum/EIPs) — canonical EIP repo (EIPS/*.md with YAML frontmatter: eip, title, status, type/category, author, created, etc.)
- [ethereum/ercs](https://github.com/ethereum/ercs) — canonical ERC repo (ERCs moved here; new ERCs and updates go here)
- [EIP-1](https://eips.ethereum.org/EIPS/eip-1) — EIP purpose and guidelines

## Definitions

- **Proposal**: Umbrella term for a single entry in the list: an EIP or ERC with number, title, status, category, **type** (ProposalType), and official URL. Entity type is `EntityType.Proposal`; data type is `ProposalEntry`.
- **ProposalType**: Enum `{ Eip, Erc }`. **Eip** = proposal that is not an ERC (Core, Networking, Interface, Meta, or Informational from the EIPs repo). **Erc** = application-level standard: from ethereum/ercs or from ethereum/EIPs with category/type ERC.
- **Category**: Standards-track category (Core, Networking, Interface, ERC, Meta, Informational) from repo frontmatter; stored as `category` to avoid collision with `type: ProposalType`.
- **Official data**: Metadata (number, title, status, category, type (ProposalType), url) from ethereum/EIPs and ethereum/ercs (e.g. GitHub API or raw markdown frontmatter).
- **Official links**: eips.ethereum.org for status pages and per-proposal pages (e.g. https://eips.ethereum.org/EIPS/eip-{number}).

## Official link targets

| Resource | URL |
|----------|-----|
| Status home | https://eips.ethereum.org/ |
| Core EIPs | https://eips.ethereum.org/core |
| Networking | https://eips.ethereum.org/networking |
| Interface | https://eips.ethereum.org/interface |
| ERCs | https://eips.ethereum.org/erc |
| Meta | https://eips.ethereum.org/meta |
| Informational | https://eips.ethereum.org/informational |
| Single EIP/ERC | https://eips.ethereum.org/EIPS/eip-{number} |
| EIPs repo | https://github.com/ethereum/EIPs |
| ERCs repo | https://github.com/ethereum/ercs |

## Status and category values

Use the same status and category terms as on eips.ethereum.org (from EIP-1 and repo frontmatter):

- **Status**: Living, Withdrawn, Stagnant, Final, Last Call, Review, Draft, Idea
- **Category**: Standards Track (subcategories: Core, Networking, Interface, ERC), Meta, Informational (stored as `category`).

## Filters and sorts

Use Spec 099 (Filters) and Spec 105 (Sorts) for the list UI. The following filters and sort options are available.

### Filters

- **Type (EIP vs ERC)** — exclusive single-select (or “All”). Uses `ProposalType` enum.
  - **All**: show every proposal.
  - **EIP only**: `type === ProposalType.Eip`.
  - **ERC only**: `type === ProposalType.Erc`.
- **Category** — single- or multi-select (Union within group): Core, Networking, Interface, ERC, Meta, Informational. Filter by stored `category` field.
- **Status** — single- or multi-select (Union within group): Living, Withdrawn, Stagnant, Final, Last Call, Review, Draft, Idea. Filter by stored `status` field.

Filter groups are combined with intersection across groups.

### Sorts

- **Number (asc / desc)**: by proposal number. Default for numeric browsing.
- **Title (A–Z / Z–A)**: by title string, case-insensitive.
- **Status (workflow order / reverse)**: by lifecycle order. Reverse = Final first.
- **Category (group then number)**: by category then by number within category.
- **Type (EIP then ERC, or reverse)**: by `type` (ProposalType) then by number.

Default sort is number ascending. The route may persist active filter/sort in URL params or local state per product preference (URL persistence is out of scope for this spec unless added elsewhere).

## Data source options

1. **GitHub API**  
   - List: `GET https://api.github.com/repos/ethereum/EIPs/contents/EIPS`, `GET https://api.github.com/repos/ethereum/ercs/contents/ERCS` (or equivalent paths).  
   - Per-file: fetch raw markdown from `download_url` and parse YAML frontmatter (e.g. `eip`, `title`, `status`, `type`) to build list.  
   - Rate limits: unauthenticated 60/hr; optional token for higher limits.

2. **Raw markdown**  
   - `https://raw.githubusercontent.com/ethereum/EIPs/master/EIPS/eip-{n}.md` (and ethereum/ercs for ERCs).  
   - Parse frontmatter only (first `---` block) to avoid loading full body; list can be built from directory listing (GitHub API) + batch raw fetches.

3. **No scraping eips.ethereum.org HTML**  
   - The Jekyll site is the canonical human-facing index but does not expose a stable JSON/API. Prefer repo as data source and use eips.ethereum.org only as the target for links.

## Implementation

- **DataSource**: Entry in `src/constants/data-sources.ts` for the proposal list source (e.g. `Eips`).
- **Collection**: TanStack DB collection `Proposals` (`src/collections/Proposals.ts`), keyed by number. Normalize at collection boundary: number, title, status, **category** (Core, Networking, Interface, ERC, Meta, Informational), **type** (`ProposalType.Eip` | `ProposalType.Erc`), `url`, `$source`. Entries from ercs repo get `type: ProposalType.Erc`; entries from EIPs repo get `type: ProposalType.Erc` if category is ERC, else `ProposalType.Eip`.
- **Data type**: `ProposalEntry` and `ProposalEntry$Id` in `src/data/ProposalEntry.ts`; entity type `EntityType.Proposal`.
- **Sync**: Populate from GitHub (list + frontmatter parse or batched raw fetches). Respect Spec 065: all data that feeds the UI is written into the collection and read via live queries; no component fetches directly.
- **UI**: Display all proposals with number, title, status, category, and type (Eip/ERC). Each row/item links to the official URL and optionally to the internal detail route. Use Filters (Spec 099) for type (ProposalType), category, and status; use Sorts (Spec 105) for number, title, status, category, and type.
- **Dedicated explorer route**: Explorer page at `/eips` (`src/routes/eips/+page.svelte`) loads `proposalsCollection` via `useLiveQuery`, renders the list with Filters and Sorts, links to official eips.ethereum.org and to `/eips/[number]`. Optional `/eips/erc` or query param to pre-apply “ERC only” filter.
- **EntityView for single proposal**: Route `/eips/[number]` (`src/routes/eips/[number]/+page.svelte`) displays one proposal using `<EntityView entityType={EntityType.Proposal}>` and a view component (e.g. `Proposal.svelte`) that provides title, metadata (status, category, type Eip/ERC), and link to eips.ethereum.org.

## Acceptance criteria

- [x] DataSource enum includes a value for proposal list data.
- [x] A TanStack DB collection `Proposals` stores normalized `ProposalEntry` (number, title, status, category, type ProposalType, official url); sync from ethereum/EIPs and ethereum/ercs; normalization at collection boundary; type derived as above.
- [x] A dedicated explorer route at `/eips` renders the full proposal list with Filters and Sorts; optional `/eips/erc` or query param for ERC-only pre-filter.
- [x] A single-proposal route `/eips/[number]` uses EntityView (Spec 088) with `EntityType.Proposal` and a view component that shows title, status, category, type (Eip/ERC), and link to official eips.ethereum.org.
- [x] UI shows all proposals with status, category, and type; each entry links to https://eips.ethereum.org/EIPS/eip-{number} and optionally to the internal detail route.
- [x] Filters: Type (All / EIP only / ERC only), Category (Core, Networking, Interface, ERC, Meta, Informational), Status; implemented via Spec 099.
- [x] Sorts: Number (asc/desc), Title (A–Z/Z–A), Status, Category, Type (EIP then ERC or reverse); implemented via Spec 105; default sort number asc.
- [x] No scraping of eips.ethereum.org HTML for list data; data comes from GitHub repos only; eips.ethereum.org used only as link target.
- [x] Spec 065: external fetch only in collection/sync layer; UI reads via live query only.

## Status

Complete.
