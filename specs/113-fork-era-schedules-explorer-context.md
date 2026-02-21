# Spec 113: Fork and era schedules for explorer context

Provide the explorer with full context for past and future protocol forks and reorgs by consuming versioned fork schedule data from canonical client/spec sources, and by labeling block lists (e.g. in `<Network>`) with era groups so users can see which blocks belong to which upgrade era.

## References

- Spec 060 (network and block pages), Spec 063 (network/block/transaction components), Spec 062 (ItemsList with getGroupKey/getGroupLabel/GroupHeader), Spec 065 (external cache / live query)
- Research: Geth `params/config.go`, consensus-specs `configs/mainnet.yaml`, EthereumJS common `chains.ts`/`hardforks.ts`, Nethermind `Chains/foundation.json`, ECIP-1091 (ETC), Forkcast (process context links)

## Scope

1. **Data sources** — Canonical, low-churn sources for fork activation (block, timestamp, epoch) and optional forkHash.
2. **Versioned “install”** — How to bring GitHub-based data into the app without git submodules: vendored generated JSON + manifest + sync script.
3. **Unified schema** — Normalized fork/era model and per-chain schedule used by the UI.
4. **UI** — Era labels in block lists (e.g. `<Network>` Blocks list) via existing EntityList/ItemsList grouping; block detail context (e.g. “Part of: London”); optional links for reorg/forked-block context.

## Data sources (summary)

| Source | What | Format | Use |
|--------|------|--------|-----|
| Geth `params/config.go` | EL fork blocks + timestamps (mainnet, Sepolia, Holesky, Hoodi) | Go struct (JSON-tagged) | Primary EL schedule; requires extraction → JSON |
| consensus-specs `configs/mainnet.yaml` | CL fork epochs, TTD, blob schedule | YAML | Primary CL schedule (mainnet); parse → JSON |
| @ethereumjs/common `chains.ts` | EL fork list + block/timestamp + forkHash (mainnet + testnets) | TypeScript | Alternative EL + forkHash; extract or depend on build output |
| Nethermind `Chains/foundation.json` | EL transitions (EIP-level, hex block/timestamp) | JSON | Alternative single-file EL; hex decoding needed |
| ECIP-1091 | ETC mainnet + testnets fork blocks + forkId | ECIP tables | ETC-only schedule |
| Forkcast | Upgrade process, EIP context | Web app | Link only (e.g. “Upgrade process” → forkcast.org) |
| Explorers (Etherscan blocks_forked, Beaconscan slots-forked) | Reorg/forked blocks | HTML/API | Link for “Forked blocks” context; no structured ingest required here |

Reorg “full context”: era labels + link(s) to explorer forked-block pages (and optional future reorg API) suffice; no requirement to ingest live reorg feeds in this spec.

## Versioned dependency without git submodules

**Approach: vendored generated data + manifest + sync script.**

- **No submodules.** No cloning of ethereum/go-ethereum or ethereum/consensus-specs into the repo.
- **Generated artifacts:** A build-time (or on-demand) script produces normalized JSON from remote sources and writes it under a dedicated directory, e.g. `src/data/fork-schedules/` (or `src/constants/fork-schedules/` if preferred).
- **Pinned refs:** The script fetches from **raw GitHub URLs with a pinned ref** (tag or full commit SHA), e.g.:
  - `https://raw.githubusercontent.com/ethereum/go-ethereum/<REF>/params/config.go` (parse or use a pre-built extractor)
  - `https://raw.githubusercontent.com/ethereum/consensus-specs/<REF>/configs/mainnet.yaml`
  - For TS/JSON sources: raw URLs to JSON or a small extract script that assumes a specific release (e.g. npm package version or GitHub ref).
- **Manifest:** A small JSON file (e.g. `fork-schedules.manifest.json`) next to the generated data records:
  - `sources: { "geth": { ref, url }, "consensus-specs": { ref, url }, ... }`
  - Optional: `lastSynced` (ISO timestamp) and script version.
- **“Install” semantics:** Running the sync script (e.g. `deno task forks:sync`) updates the generated JSON and manifest. CI or local dev can run it when upgrading fork data. No `git submodule add` or `git pull` of upstream repos; only HTTP GET to raw URLs and file writes.
- **Fallback:** If the script cannot parse a source (e.g. Go file format change), the app continues to use the last successfully generated data; the manifest refs document which version is installed.

**Implementation options for extracting Geth config:**

- **A)** Maintain a minimal parser in the sync script that reads the Go file as text and extracts the literal block/timestamp numbers for known chain configs (brittle but no Go runtime).
- **B)** Use a one-off export from a Geth build (e.g. dump chain config as JSON) and commit that JSON; sync script only updates consensus-specs and other non-Go sources.
- **C)** Depend on a community-maintained JSON mirror (e.g. a repo that publishes `mainnet-forks.json` from Geth) and point the script at that URL with a ref.

Prefer A or C so that a single script can refresh all sources without requiring a Go toolchain.

## Unified schema

**Fork activation (per chain):**

- `chainId: number`
- `forks: Array<{ name: string, activation: { block?: number, timestamp?: number, epoch?: number }, forkHash?: string, kind?: 'execution' | 'consensus' | 'blob' }>`
- Order: by activation (block or timestamp or epoch) ascending. For post-merge chains, execution and consensus may be merged into one ordered list using timestamp/epoch for alignment where applicable.

**Era (derived):**

- An “era” is the contiguous range of blocks (or time/epoch range) during which a single protocol version is active. For EL: from this fork’s activation up to (but not including) the next fork’s activation. Era id can be the fork `name` (e.g. `"London"`, `"Shanghai"`).
- Helper: `getEraAtBlock(chainId, blockNumber)` → `{ eraId: string, label: string, startBlock?, endBlock? }` (and similarly for timestamp/epoch if needed for CL or post-merge).

**Chains:**

- At least: Ethereum mainnet (1), Sepolia (11155111), Holesky (17000), Hoodi (560048). Optionally Ethereum Classic (61) from ECIP-1091.
- Schema and sync script should allow adding more chains (e.g. ETC, other testnets) without changing the UI contract.

**File layout (proposed):**

- `src/data/fork-schedules/schedules.json` — normalized `{ chains: { [chainId]: { chainId, forks: [...] } } }`.
- `src/data/fork-schedules/manifest.json` — `{ sources: { ... }, lastSynced?: string }`.
- `scripts/sync-fork-schedules.ts` (or `.mjs`) — fetches from pinned URLs, normalizes, writes the above. Invoked by `deno task forks:sync`.

## UI: era labels in block lists

- **EntityList in Network:** When rendering the Blocks list, pass:
  - `getGroupKey(block)` → era id for that block (e.g. fork name from `getEraAtBlock(chainId, block.number)`).
  - `getGroupLabel(eraId)` → human-readable label (e.g. “London”, “Shanghai”, “Prague”).
  - Optionally `GroupHeader` snippet to render a richer era header (e.g. “London (blocks 12,965,000 – 15,537,394)” or “Shanghai (from 2023-04-12)”).
- **Sort/group order:** Groups follow block order (descending by block number). So the “current” era appears first, then the previous era, etc. Within each group, items stay sorted by `getSortValue` (e.g. `-block.number`).
- **Placeholders:** Placeholder blocks (not yet loaded) get an era from the placeholder key (block number) via `getEraAtBlock(chainId, placeholderKey)`. If unknown, group under a fallback like “Unknown” or the nearest known era.
- **Chains without schedule:** If no fork schedule exists for a chainId, do not pass `getGroupKey`/`getGroupLabel` (same as today: ungrouped list).

## UI: block detail context

- On block page (or block row tooltip/summary): show which era the block belongs to, e.g. “Part of: London” or “London (12,965,000 – 15,537,394)”. Optional link to ethereum.org fork timeline or Forkcast for “Upgrade process”.
- Optional: “Forked blocks” / “Reorgs” link to the network’s explorer forked-blocks page (e.g. Etherscan blocks_forked, Beaconscan slots-forked) when available (from existing explorer URL helpers).

## Future / optional

- **Reorg feed:** If a reorg API (e.g. Coin Metrics) is integrated later, it can remain separate from fork schedules; this spec only requires era context and links.
- **CL epochs on block page:** For post-merge, block could show corresponding consensus epoch and CL fork name if we add epoch↔block mapping.

## Acceptance criteria

- [ ] A sync script (e.g. `scripts/sync-fork-schedules.ts`) fetches fork data from pinned raw GitHub (or equivalent) URLs for at least Geth (or a JSON mirror) and consensus-specs mainnet; writes normalized `schedules.json` and `manifest.json` under `src/data/fork-schedules/` (or agreed path). No git submodules.
- [ ] Manifest records source refs (and optionally lastSynced). `deno task forks:sync` (or equivalent) runs the script.
- [ ] Normalized schema includes per-chain `forks` with `name`, `activation` (block/timestamp/epoch), optional `forkHash`, and ordering; helper `getEraAtBlock(chainId, blockNumber)` (or equivalent) returns era id and label.
- [ ] Network view Blocks list uses `getGroupKey`/`getGroupLabel` (and optionally `GroupHeader`) so blocks are grouped by era; group order follows block order (e.g. newest era first).
- [ ] Block detail (or block row) shows era context (e.g. “Part of: London” with optional range).
- [ ] Placeholder blocks receive an era from their block number when schedule exists; otherwise list remains ungrouped for that chain.
- [ ] Chains without schedule data do not pass grouping props (unchanged behavior).
- [ ] Optional: link to explorer “Forked blocks” (or equivalent) and/or Forkcast from network/block context where relevant.

## Status

Draft.

## Output when complete

`DONE`
