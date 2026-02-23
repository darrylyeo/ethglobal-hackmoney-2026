# Spec 115: Consensus data model and Execution / Consensus UI

Extend the fork/era model with protocol enums, add consensus (beacon) data context, and restructure the network page so execution (blocks) and consensus (epochs/slots) are separate sections when applicable.

## References

- Spec 113 (fork and era schedules), specs/113-beacon-fork-sources.md (CL fork sources), Spec 114 (other EVM fork sources)
- Epoch↔block: 32 slots/epoch, 12 s/slot; post-merge slot = (blockNumber - mergeBlock); epoch = bellatrixEpoch + floor((blockNumber - mergeBlock) / 32)

## Scope

1. **Consensus data** — Beacon chain (Ethereum) and optionally other chains: static schedule from consensus-specs (per-chain modules `src/constants/forks/[chainId].ts` with `kind: 'consensus'` forks in the `forks` array); runtime from Beacon API when needed.
2. **Protocol enums and Fork entity** — `ExecutionProtocol` and `ConsensusProtocol` enums; add optional fields to fork types so we can label which protocol/layer a fork belongs to.
3. **Network page** — Rename "Blocks" section to "Execution"; when the chain has consensus data (e.g. Ethereum mainnet/Sepolia/Holesky), show a "Consensus" section with epochs/slots in a similar list structure.

## Protocol enums

- **ExecutionProtocol:** Identifies the execution-layer protocol or chain family for a fork.
  - Values: `Ethereum` (Geth-style EL), `OpStack`, `PolygonBor`, `ArbitrumNitro`, `Other`.
  - Used when `ForkScheduleKind` is Execution (or Blob when tied to EL).
- **ConsensusProtocol:** Identifies the consensus layer, if any.
  - Values: `EthereumBeacon`, `None` (or omit for pre-merge / L2s without CL).
  - Used when `ForkScheduleKind` is Consensus.

Location: `src/constants/forks/types.ts` (alongside `ForkScheduleKind`).

## Fork entity fields

- **Fork** (single type for all fork data): Optional `executionProtocol?: ExecutionProtocol`, `consensusProtocol?: ConsensusProtocol`. Per-chain entries in `src/constants/forks/[chainId].ts` use `ForkEntry<ForkId>[]`; index builds `Fork[]` with `$id`, `name`. Mainnet upgrade data (links, eipNumbers) lives in `1.ts`; `mainnetForksWithUpgrades` from index filters mainnet forks with links/eipNumbers.

## Consensus data (Ethereum beacon and others)

- **Ethereum:** CL fork schedule is in `src/constants/forks/1.ts` (Fork enum, `forks` array; Altair, Bellatrix, Capella, Deneb, Electra, Fulu with `activation.epoch`). That module exports `mergeBlock` (Paris) and `bellatrixEpoch`. Current epoch at a given EL block: `getCurrentEpoch(chainId, blockNumber)` = bellatrixEpoch + floor((blockNumber - mergeBlock) / 32) when blockNumber >= mergeBlock; otherwise null.
- **Other chains:** L2s (OP Stack, Arbitrum, etc.) do not expose a separate consensus list in the same way; Consensus section is shown only when chain has at least one `kind: 'consensus'` fork in schedule (i.e. Ethereum mainnet, Sepolia, Holesky).

## Network page: Execution and Consensus sections

- **Rename:** The list of blocks is titled **"Execution"** (not "Blocks") to reflect that these are execution-layer blocks. Same data and behavior (era grouping, placeholders, etc.).
- **Consensus section:** When the chain has consensus forks (e.g. `hasConsensusSchedule(chainId)`), show a section **"Consensus"** with structure similar to Execution:
  - Title: "Consensus" (or "Epochs" as subheading).
  - List of recent epochs (e.g. current epoch and a small range). Each item: epoch number (and optional slot range). Link target: in-app route `/network/[name]/epoch/[epoch]` if implemented, or external (e.g. beaconcha.in, ethereum.org) or no link for now.
  - Epoch list is derived from current execution block height: `getCurrentEpoch(chainId, currentBlock)` and then [currentEpoch - N, ..., currentEpoch]. Requires merge block and Bellatrix epoch from schedule (Paris fork block, Bellatrix fork epoch).
- **When to show Consensus:** Only when `hasConsensusSchedule(chainId)` is true (chain has at least one fork with `kind: 'consensus'`) and we can compute epoch from block (merge block and Bellatrix epoch present). Otherwise do not render the Consensus section.

## Constants and helpers

- **Per-chain modules** (`src/constants/forks/[chainId].ts`): Each chain has `export enum ForkId { ... }` and `export const forks: readonly ForkEntry<ForkId>[]`. No per-chain exports of mergeBlock/bellatrixEpoch—derived in index.
- **Registry and API** (`src/constants/forks/index.ts`): Builds single `forks` array from per-chain modules; exports `forkByChainId`, `forkChainIds`, `consensusChainIds`, `mergeBlockByChainId`, `bellatrixEpochByChainId`, `beaconEpochExplorerByChainId`, `slotsPerEpoch`, `getEraAtBlock`, `getCurrentEpoch`, `mainnetForksWithUpgrades`, and re-exports `Fork`. No separate fork-schedules file.
- **Lookups:** Import from `src/constants/forks/index.ts` (e.g. `forkByChainId[chainId]`, `consensusChainIds.has(chainId)`).
## Acceptance criteria

- [x] ExecutionProtocol and ConsensusProtocol enums in types; Fork has optional executionProtocol, consensusProtocol.
- [x] Sync script sets executionProtocol/consensusProtocol on emitted forks where applicable.
- [x] Network view: "Blocks" list renamed to "Execution"; when chain has consensus schedule and merge/Bellatrix data, show "Consensus" section with list of recent epochs (derived from current block height).
- [x] Helpers getMergeBlock, getBellatrixEpoch, getCurrentEpoch, hasConsensusSchedule implemented and used.

## Status

Complete. Enums and Fork fields in types.ts; fork data and upgrade info consolidated in `src/constants/forks/` (index + per-chain modules). Network.svelte uses "Execution" title and adds "Consensus" EntityList (recent epochs) when hasConsensusSchedule and currentBlockNumber available; network page passes currentBlockNumber to NetworkView.
