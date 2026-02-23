# Beacon (consensus layer) fork data — sources

Research summary for **associated beacon chain forks**: best available sources to add CL fork schedules alongside existing EL fork data (Spec 113, per-chain modules `src/constants/networks/[chainId].ts`, fork upgrades page).

## Canonical static source: consensus-specs YAML

| Source | What | Format | Use |
|--------|------|--------|-----|
| **ethereum/consensus-specs** `configs/mainnet.yaml` | CL fork epochs + fork version (Altair, Bellatrix, Capella, Deneb, Electra, Fulu). Gloas, Heze, EIP stubs disabled with `EPOCH: 18446744073709551615` (2^64-1). Inline comments give approximate UTC. Also TTD, blob schedule, genesis, deposit contract. | YAML | **Canonical.** Parse `*_FORK_EPOCH` and `*_FORK_VERSION`; skip disabled (epoch === 2^64-1). Pin ref (e.g. v1.6.0), fetch raw URL. |
| **ethereum/consensus-specs** `configs/` | Only `mainnet.yaml` and `minimal.yaml` in tree. No sepolia.yaml/holesky.yaml in consensus-specs. | YAML | Mainnet + minimal only; testnets below. |

**Example (mainnet):** `ALTAIR_FORK_EPOCH: 74240`, `BELLATRIX_FORK_EPOCH: 144896`, `CAPELLA_FORK_EPOCH: 194048`, `DENEB_FORK_EPOCH: 269568`, `ELECTRA_FORK_EPOCH: 364032`, `FULU_FORK_EPOCH: 411392`.

## Runtime / live: Beacon API

| Source | What | Format | Use |
|--------|------|--------|-----|
| **Beacon API** `GET /eth/v1/config/fork_schedule` | All forks (past, present, future) the node is aware of. Response: `data: [{ previous_version, current_version, epoch }]`. | JSON | **Runtime.** Use when a beacon node or third-party provider (Chainstack, Blast, NodeReal, etc.) is available. Not a replacement for static build-time data; good for "current fork" or live checks. |

## Testnet CL configs

Sepolia and Holesky CL fork schedules are **not** in ethereum/consensus-specs `configs/` (that dir has only mainnet + minimal). They live in:

| Source | What | Use |
|--------|------|-----|
| **eth-clients/holesky** | Holesky config (e.g. `custom_config_data`), post-merge, Shapella at epoch 256. | Fetch testnet YAML or derived config; map CONFIG_NAME to chainId 17000. |
| **eth-clients/sepolia** | Sepolia config (chainId 11155111), fork epochs e.g. Dencun 132608, Electra 222464. | Same approach for Sepolia. |
| **Hoodi** | Post-merge testnet; launchpad notes (notes.ethereum.org/@launchpad/hoodi). Shapella at epoch 256. | Config may be in eth-clients or launchpad; chainId 560048 (if in our networks). |

For a single canonical **mainnet** CL schedule, consensus-specs `configs/mainnet.yaml` is sufficient. Testnet support requires fetching from eth-clients/* or equivalent.

## Epoch ↔ execution block (post-merge)

To show "CL era" on an execution block page (e.g. "Part of: Deneb") we need epoch at that block:

- **CL constants:** 32 slots/epoch, 12 s/slot (from consensus-specs: `slotsPerEpoch` implicit 2^5, `SECONDS_PER_SLOT: 12`). Epoch E covers slots `E*32 .. E*32+31`.
- **Post-merge:** Execution blocks 1:1 with beacon slots (one EL block per slot when not skipped). So **slot_index = (execution_block_number - merge_block_number)** for blocks ≥ merge block.
- **Merge block:** First post-merge EL block number is determined by TTD being reached (not by epoch alone). Geth/params or execution-specs give the actual merge block; consensus-specs give `TERMINAL_TOTAL_DIFFICULTY` and Bellatrix epoch. So epoch at block B (B ≥ merge_block) = floor((B - merge_block) / 32) + bellatrix_epoch (slot 0 of Bellatrix = first slot of that epoch).
- **Practical:** Store merge block number (or derive from existing EL schedule + TTD) and Bellatrix fork epoch from consensus-specs; then `epochAtBlock(blockNum) = bellatrixEpoch + floor((blockNum - mergeBlock) / 32)` for blockNum ≥ mergeBlock. Pre-merge blocks have no CL epoch (or "Pre-merge").
- **References:** eth2book (annotated spec), consensus-specs configs (TTD, fork epochs), execution-specs or Geth for merge block.

## Blob schedule (mainnet.yaml)

`mainnet.yaml` also defines **BLOB_SCHEDULE**: list of `{ EPOCH, MAX_BLOBS_PER_BLOCK }` (e.g. EPOCH 412672 → 15 blobs, 419072 → 21). This is a sub-schedule within Deneb/Electra rather than a separate fork; useful for "max blobs at this block" if we add blob support.

## Beacon API — exact schema

- **Endpoint:** `GET /eth/v1/config/fork_schedule`. Spec: https://ethereum.github.io/beacon-APIs/#/Config/getForkSchedule
- **Response:** `{ "data": [ { "previous_version": "0x...", "current_version": "0x...", "epoch": "123" } ] }`. Each object is the fork active at that epoch (current_version) and the previous fork version. Epoch is string. Array order = chronological.
- **Also:** `GET /eth/v1/beacon/states/{state_id}/fork` returns the single Fork for that state (previous_version, current_version, epoch). Useful for "current fork at head".

## Human-facing links

| Source | What | Use |
|--------|------|-----|
| **ethereum.org** `/en/upgrades/beacon-chain/` | Beacon chain and upgrades (Altair, Bellatrix, Merge). | Link "Beacon chain" or "CL upgrades" from fork context. |
| **ethereum.org** `/ethereum-forks/` | Timeline of all forks (EL + merge narrative). | Already used in fork upgrades page. |
| **Forkcast** | Upgrade process, EIP context. | Already linked from block era context. |

## Recommendation

1. **Static (sync script):** Use **consensus-specs** `configs/mainnet.yaml` as the canonical static source for mainnet. For testnets (Sepolia, Holesky), use **eth-clients/sepolia** and **eth-clients/holesky** (no testnet YAMLs in consensus-specs). Extend the existing sync script to:
   - Parse mainnet.yaml (and optionally testnet configs from eth-clients) for `*_FORK_EPOCH` / `*_FORK_VERSION`.
   - Emit consensus forks with `kind: 'consensus'` and `activation: { epoch }`.
   - Per-chain fork data lives in `src/constants/networks/[chainId].ts` (Fork enum, `forks` array with `kind` discriminator). Chain 1 has consensus forks (Altair–Fulu) and exports `mergeBlock`, `bellatrixEpoch`, `hasConsensus`.
   - Filter out disabled forks (epoch 2^64-1).
2. **Manifest:** Record consensus-specs ref/URL for mainnet; for testnets record eth-clients ref/URL per chain.
3. **Beacon API:** Document or use later for runtime "current fork" or live checks; do not rely on it for build-time schedule.

## Current repo state

- **Per-chain modules** (`src/constants/networks/[chainId].ts`): Each chain has `export enum Fork { ... }` and `export const forks`. Mainnet `1.ts` includes CL forks (Altair, Bellatrix, Capella, Deneb, Electra, Fulu) and exports `mergeBlock`, `bellatrixEpoch`, `hasConsensus`. OP Stack and other chains are EL-only in their modules.
- **Registry and API** `src/constants/forks/index.ts` builds the single `forks` array from per-chain modules and exports `mergeBlockByChainId`, `bellatrixEpochByChainId`, `forkChainIds`, `consensusChainIds`, `getEraAtBlock()`, `getCurrentEpoch()`.
- Consensus data model and Execution/Consensus UI: see **specs/115-consensus-data-execution-consensus-ui.md**.
