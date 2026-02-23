# Spec 117: EVM opcodes and precompiles per network/fork

Extend the EIPs/ERCs and fork context (Spec 112, Spec 113 fork-era schedules) with **EVM implementation data**: which opcodes and precompiles exist and how they behave, scoped by **network** (chainId) and **fork/era** (or block). This supports explorer context (e.g. “which EVM features at this block”), calldata/bytecode tooling, and links to authoritative specs.

## References

- Spec 112 (EIP/ERC list and official sources), Spec 113 (fork-era schedules, getEraAtBlock)
- `src/constants/forks/index.ts` (forks array, forkByChainId, mainnetForksWithUpgrades, getEraAtBlock, getCurrentEpoch; Fork has name, optional links, eipNumbers)
- `src/constants/forks/types.ts` (Fork, ForkEntry, ChainForkSchedule); optional `src/data/fork-schedules/` (schedules.json from sync)

## Scope

1. **Data sources** — Canonical or widely used sources for opcode and precompile definitions and per-fork/per-chain availability.
2. **Schema** — Normalized model: opcodes and precompiles keyed by fork (or fork + chain where chains differ), with metadata (mnemonic, gas, input/output, description, EIP link).
3. **Integration** — How this data is consumed: constants or generated JSON under versioned sync (similar to Spec 113), and how it ties to existing fork names and `getEraAtBlock(chainId, blockNumber)`.
4. **UI** — Optional: expose in explorer (e.g. fork/era context, “Opcodes & precompiles” section or link to evm.codes / specs).

## Researched data sources

### Opcodes

| Source | What | Format | Pros / cons |
|--------|------|--------|-------------|
| **evm.codes** (duneanalytics/evm.codes) | Single `opcodes.json`: hex → input, output, description; optional `dynamicFee` per fork (homestead, constantinople, petersburg, istanbul, berlin, spuriousDragon, cancun, EOF, prague) for gas/behavior | JSON | Rich, fork-aware gas; no explicit “opcodes added in fork X” list; would need to derive or maintain fork→opcode set |
| **ethereum/execution-specs** | Per-fork Python spec in `src/ethereum/forks/<fork>/`; opcode tables and gas in code | Python | Authoritative; requires parsing Python or using rendered docs; best as reference link |
| **ethereum.org** (developers/docs/evm/opcodes) | Human-readable opcode reference | HTML | Link only; not machine-readable |

**Recommendation:** Use **evm.codes `opcodes.json`** as primary ingest for opcode metadata and fork-scoped gas (raw URL with pinned ref). Map fork names (slug) to evm.codes dynamicFee keys (e.g. `berlin` → Berlin, `cancun` → Cancun). Maintain a small **fork → opcodes added** mapping (or derive from EIPs in Fork / mainnetForksWithUpgrades) for “available in this fork” if needed. Link to execution-specs and ethereum.org for authority.

### Precompiles

| Source | What | Format | Pros / cons |
|--------|------|--------|-------------|
| **evm.codes** (duneanalytics/evm.codes) | Single `precompiled.json`: address (0x01–0x11, 0x100) → name, input, output, description; optional `dynamicFee` by fork (homestead, byzantium, prague) | JSON | Simple, matches opcodes workflow; single global list |
| **shemnon/precompiles** | Per-precompile JSON (`_data/precompiles/eip155-{chainId}-0x{addr}.json`) + per-chain **schedule** (`eip155-{chainId}-schedule.json`): block → list of precompile ids | JSON, CAIP-2 | **Per-chain activation by block**; multi-chain; good for “which precompiles at block N on chain C” |
| **EIP-2003 (EVMC)** | Precompile modules; fork/revision determines which addresses exist | EIP | Reference only |

**Recommendation:** Use **evm.codes `precompiled.json`** for precompile metadata and gas (pinned ref). Use **shemnon/precompiles** for **per-chain activation schedule** (which precompiles exist at which block per chainId) when available; fallback to a fork-based mapping derived from mainnet fork list for chains without schedule files.

### Summary

- **Opcodes:** evm.codes `opcodes.json` (pinned ref) + optional fork→opcode-set mapping; link to execution-specs.
- **Precompiles:** evm.codes `precompiled.json` (pinned ref) + shemnon/precompiles per-chain schedule JSON where present (e.g. eip155-1-schedule.json for mainnet).
- **Networks:** Align with existing fork schedules (Spec 113): chainId + block → era/fork via `getEraAtBlock` (from `src/constants/forks/index.ts`); fork name/slug from Fork (slug derived from name via `getForkSlugByEraName`).

## Data model (proposed)

- **Opcodes:** List or map of `{ hex, mnemonic?, input, output, description, gasBase?, dynamicFeeByFork? }`; fork slug from our fork set. Optionally `forkOpcodes: Record<forkSlug, hex[]>` for “opcodes available in fork”.
- **Precompiles:** List or map of `{ address, name, input, output, description, gasBase?, dynamicFeeByFork? }`; per-chain activation: `chainId → blockNumber → address[]` (from shemnon schedule) or derived from fork activation.
- **Lookup:** `getOpcodesForFork(forkSlug)` or `getOpcodesForEra(chainId, blockNumber)` (era → fork → opcodes). `getPrecompilesForBlock(chainId, blockNumber)` using schedule or fork.

## Versioned sync (optional)

- Script (e.g. `deno task evm-spec:sync`) fetches from pinned raw URLs: evm.codes `opcodes.json`, `precompiled.json`; shemnon `eip155-*-schedule.json` (or selected chains). Writes under `src/data/evm-spec/` (or `src/constants/`) and a small manifest (sources, refs, lastSynced). No git submodules.

## UI (optional)

- Fork/era context (e.g. block or network page): “Opcodes & precompiles” section or link to evm.codes / execution-specs.
- If full data is present: filterable list of opcodes/precompiles for selected fork or chain+block.

## Acceptance criteria

- [ ] Documented data sources and recommendations (evm.codes, shemnon/precompiles, execution-specs) in this spec or a linked doc.
- [ ] Normalized types/schema for opcodes and precompiles (and optionally per-chain precompile schedule) that align with existing fork slugs and Spec 113 era model.
- [ ] Either: (A) vendored/generated JSON + sync script from pinned evm.codes (and optionally shemnon) refs, with manifest; or (B) minimal in-repo constants derived from evm.codes with links to upstream, and a short “how to refresh” note.
- [ ] Helper(s) to resolve “opcodes / precompiles for this fork or chain+block” using fork schedules where applicable.
- [ ] Optional: Explorer surface (link or section) for EVM opcodes/precompiles in fork/era context.

## Status

Draft. Data sources researched 2026-02-21.

## Output when complete

`DONE`
