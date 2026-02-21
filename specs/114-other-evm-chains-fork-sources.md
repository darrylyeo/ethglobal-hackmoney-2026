# Other EVM chains: fork/upgrade sources

Research summary for **fork and upgrade schedules on non-Ethereum EVM chains** (L2s, alternate L1s). Complements Spec 113 (Ethereum fork schedules) and enables a future fork-upgrades UI per chain (e.g. `/network/[chainId]/forks` for any chain with a known schedule).

## Scope

- **Goal:** Identify canonical or well-maintained sources for fork/upgrade activation (block or timestamp) per chain.
- **Use:** Feed into sync script and `schedules.json` (or per-chain fork list) so the explorer can show "Fork upgrades" and era labels for supported networks.
- **Not in scope:** ethereum-lists/chains and chainlist.org — they provide chain metadata (name, chainId, RPC, explorers) but **do not** include fork schedules or hardfork activation data.

## Summary by chain family

| Chain family | Chains (examples) | Activation type | Canonical source | Machine-readable |
|--------------|-------------------|----------------|------------------|------------------|
| **Ethereum** | 1, 11155111, 17000 | Block + timestamp (EL), epoch (CL) | Geth params, consensus-specs | Yes (sync script exists) |
| **OP Stack (Superchain)** | 10, 8453, 11155420, 84532 | Timestamp | superchain-registry TOML | Yes |
| **Polygon PoS** | 137, 80002 | Block (Bor + Heimdall) | Polygon docs + PIPs | No (docs table / PIPs) |
| **Arbitrum** | 42161, 421614, 42170 | Timestamp (ArbOS) | Arbitrum docs + governance | No (docs / announcements) |
| **BNB Smart Chain (BSC)** | 56 | Block + timestamp | docs.bnbchain.org | No (docs / announcements) |
| **zkSync Era** | 324, 300 | Version + governance | docs.zksync.io, zksync-era CHANGELOG | No |
| **Linea** | 59144, 59141 | Release + date | docs.linea.build release notes | No |
| **Scroll** | 534352 | Timelock / multisig | docs.scroll.io upgrades (process only) | No |
| **Other EVM** | XDC, Unichain, Monad, Sonic, etc. | Varies | Chain-specific docs; many have no single fork list | Varies |

---

## OP Stack (Optimism, Base, OP Sepolia, Base Sepolia)

**Chains:** Optimism (10), Base (8453), OP Sepolia (11155420), Base Sepolia (84532), and other Superchain chains.

**Activation:** Timestamp-based. All Superchain chains that follow the same config activate at the same Unix timestamp.

**Canonical source (machine-readable):**

| Source | What | Format | Use |
|--------|------|--------|-----|
| **ethereum-optimism/superchain-registry** | `superchain/configs/mainnet/superchain.toml`, `superchain/configs/sepolia/superchain.toml` | TOML | **[Canonical].** `[hardforks]` section: `canyon_time`, `delta_time`, `ecotone_time`, `fjord_time`, `granite_time`, `holocene_time`, `isthmus_time`, `jovian_time` (Unix). Bedrock is prior to Canyon; add manually or from docs. |
| **docs.optimism.io** | Network upgrades table (mainnet + Sepolia), block numbers “around” activation | HTML | Human-facing; optional block hints for display. |
| **specs.optimism.io** | Per-upgrade spec (e.g. Ecotone, Fjord) | HTML | Link “Spec” per fork. |
| **changelog.optimism.io** | Upgrade announcements | HTML | Link “Changelog”. |

**Example (mainnet superchain.toml):**

```toml
[hardforks]
canyon_time = 1704992401
delta_time = 1708560000
ecotone_time = 1710374401
fjord_time = 1720627201
granite_time = 1726070401
holocene_time = 1736445601
isthmus_time = 1746806401
jovian_time = 1764691201
```

**Config layout:** Under `superchain/configs/` the production targets are `mainnet/` and `sepolia/` (each with a single `superchain.toml`). Other dirs: `rehearsal-0-bn/`, `sepolia-dev-0/` for dev/test. All chains that share a target (e.g. Optimism, Base on mainnet) use the same hardfork timestamps; no per-chain override in the TOML. The repo also provides `chainList.toml` / `chainList.json` (generated) listing chains and their config; useful to map chain_id → config name.

**Sepolia TOML:** Includes an extra key `pectra_blob_schedule_time` (e.g. 1742486400) for the blob schedule sub-activation; mainnet may add a similar key when applicable. Parser should accept unknown `*_time` keys and emit them as fork entries (e.g. kind `blob` or name “Pectra blob schedule”) so new keys don’t break sync.

**Sync approach:** Fetch raw TOML from superchain-registry (pinned ref), parse `[hardforks]`, map to chainIds 10, 8453 (mainnet config) and 11155420, 84532 (sepolia config). Add Bedrock (e.g. 1686079703 for mainnet) from docs or hardcode once.

**Naming:** Geology-themed after Bedrock: Canyon, Delta, Ecotone, Fjord, Granite, Holocene, Isthmus, Jovian.

---

## Polygon PoS (Bor + Heimdall)

**Chains:** Polygon (137), Polygon Amoy (80002). Mumbai deprecated.

**Activation:** Block-based (Bor = execution; Heimdall = consensus layer). Different layers have different fork names and block heights.

**Canonical source (human docs only):**

| Source | What | Format | Use |
|--------|------|--------|-----|
| **docs.polygon.technology** | “Network upgrade process” — table of Bor and Heimdall hardforks with block thresholds | HTML | **Primary.** Scrape or manually maintain list. |
| **maticnetwork/Polygon-Improvement-Proposals** | PIPs (e.g. PIP-28 Agra, PIP-33 Napoli) | Markdown | Per-fork links; block numbers sometimes in PIP. |
| **forum.polygon.technology** | Governance threads per upgrade | HTML | Link “Forum”. |

**Bor (execution) examples — Mainnet:** Delhi ≥38,189,056; Indore ≥44,934,656; Agra ≥50,523,000; Napoli ≥54,876,000; Ahmedabad ≥62,278,656. **Amoy:** Napoli ≥5,423,600; Ahmedabad ≥11,865,856; Bhilai ≥22,765,056.

**Heimdall (consensus) examples:** Aalborg, Jorvik, Danelaw at given mainnet/Amoy blocks (see docs table).

**Code/repos:** maticnetwork/bor is a Geth fork; genesis in maticnetwork/launch (e.g. mainnet-v1/sentry/bor/genesis.json) contains early Ethereum-fork blocks (Istanbul, Berlin, etc.) but **not** the Bor-native hardforks (Delhi, Indore, Agra, Napoli, Ahmedabad). Those are documented only in Polygon docs and PIPs; no single params.go or config file in Bor with Delhi/Indore/Agra block numbers.

**Sync approach:** No single JSON/TOML. Options: (A) Manual curation into a small JSON per chain (e.g. `polygon-forks.json`) updated when docs change; (B) Scrape docs (brittle); (C) Omit from auto-sync and only support Ethereum + OP Stack initially.

---

## Arbitrum (One, Nova, Sepolia)

**Chains:** Arbitrum One (42161), Arbitrum Nova (42170), Arbitrum Sepolia (421614).

**Activation:** Timestamp-based. ArbOS upgrades (e.g. ArbOS 51 “Dia”, ArbOS 40 “Callisto”) act as hardforks; each chain has its own activation timestamp.

**Canonical source (human docs / governance):**

| Source | What | Format | Use |
|--------|------|--------|-----|
| **docs.arbitrum.foundation** | “Network upgrades” — list of upgrades with approval and activation timestamps per chain | HTML | **Primary.** No machine-readable export. |
| **docs.arbitrum.io** | ArbOS releases (e.g. ArbOS 51 Dia), upgrade notices | HTML | Per-upgrade details and links. |
| **Governance (AIPs)** | Constitutional AIPs for One/Nova upgrades | — | Link “Governance”. |

**Example (from research):** ArbOS 51 Dia — Sepolia 2025-12-01 17:00:36 UTC; One & Nova 2026-01-08 17:00:02 UTC. ArbOS 40 Callisto — Sepolia 2025-05-06 14:54:45 UTC; One & Nova 2025-06-17 22:56:23 UTC.

**Code/repos:** OffchainLabs/nitro (releases, ArbOS versions); OffchainLabs/nitro-contracts. No chain config file in repo that lists all ArbOS activation timestamps; those come from governance execution and docs.

**Sync approach:** No TOML/JSON from upstream. Manual curation into JSON (e.g. `arbitrum-forks.json`) or omit from initial multi-chain fork support.

---

## zkSync Era (324, 300)

**Chains:** zkSync Era (324), zkSync Era Sepolia (300).

**Activation:** Protocol upgrades are documented with version numbers (e.g. 24, 25, 26, 27, 28, 29) and approximate dates; governance proposals (Tally) define activation. No single “fork at block N” or “fork at timestamp T” table.

**Sources:**

| Source | What | Format | Use |
|--------|------|--------|-----|
| **docs.zksync.io** | “Upgrades and migrations” — chronological list (2024–2025) with version numbers and governance links | HTML | **Primary.** Names (e.g. Atlas Upgrade, EVM Interpreter Upgrade, Precompiles Upgrade) and dates in prose. |
| **matter-labs/zksync-era** | core/CHANGELOG.md, GitHub releases | Markdown / HTML | Version history and release dates. |
| **Tally (zksync gov)** | Governance proposals per upgrade | Web | Link “Proposal” per upgrade. |

**Sync approach:** No machine-readable schedule. Manual curation if we add zkSync to fork UI; otherwise defer.

---

## Linea (59144, 59141)

**Chains:** Linea (59144), Linea Sepolia (59141).

**Activation:** Release-based (e.g. Beta v1.3, v1.4, v2, v3) with mainnet and Sepolia activation dates in release notes.

**Sources:** docs.linea.build “Release notes” — dates per version (e.g. Beta v1.4 mainnet Apr 28 2025, Sepolia Apr 7 2025; v1.3 mainnet Mar 3 2025; v2 mid-May 2025; v3 mainnet Jul 7 2025). No single fork block or timestamp table; narrative release notes only.

**Sync approach:** Manual curation or defer.

---

## Scroll (534352)

**Chains:** Scroll (534352), Scroll Sepolia.

**Activation:** Upgrades use a two-week timelock and L1/L2 multisig contracts; no single public “fork schedule” table with block or timestamp per upgrade.

**Sources:** docs.scroll.io “Scroll Upgrades” — describes upgrade process and contract addresses (L1/L2 multisig, timelock). No chronological list of past/future upgrades with activation block or timestamp. Roadmap and blog for high-level timeline only.

**Sync approach:** Defer unless Scroll publishes a schedule or we curate from announcements.

---

## BNB Smart Chain (BSC)

**Chains:** BSC mainnet (56). Testnets as per BNB docs.

**Activation:** Block and/or timestamp. Docs announce block height and approximate time.

**Canonical source:**

| Source | What | Format | Use |
|--------|------|--------|-----|
| **docs.bnbchain.org** | Announcements and FAQs (e.g. Feynman, Lorentz, Fermi, Maxwell) | HTML | **Primary.** Block heights and dates in prose/tables. |

**Example:** Fermi block 75,140,593 (Jan 2026); Maxwell mainnet Jun 2025; Feynman mainnet Apr 2024.

**Sync approach:** Manual curation or scrape; no canonical machine-readable schedule. Lower priority unless we explicitly add BSC to the explorer.

---

## Other EVM chains (XDC, Unichain, Monad, Sonic, etc.)

- **XDC, Unichain, Monad, Sonic, Celo, Avalanche C-Chain, Linea, Scroll, zkSync, etc.:** No single standard. Upgrade info is in chain-specific docs, blog posts, or GitHub releases. Many do not publish a single “fork schedule” table.
- **Strategy:** Add fork data only for chains we explicitly support and where we find a stable source (docs table or official JSON). Prefer not to scrape; prefer manual or script-assisted curation with clear provenance.

---

## Chain registries (no fork data)

| Source | Content | Fork schedule? |
|--------|---------|----------------|
| **ethereum-lists/chains** | name, chainId, rpc, explorers, nativeCurrency, etc. | **No.** |
| **chainid.network / chainlist.org** | Aggregated chain metadata from ethereum-lists | **No.** |
| **Chainstack Beacon API** `getForkSchedule` | Ethereum Beacon fork schedule (CL) | Yes, but Ethereum only. |

Do not rely on chain registries for fork schedules; they are metadata-only.

---

## Packages and APIs with structured fork data

Sources that expose fork/upgrade schedules in a parseable format (JSON, TS, or HTTP API).

### Ethereum execution layer (EL)

| Source | What | Format | Chains | Use |
|--------|------|--------|--------|-----|
| **@ethereumjs/common** (ethereumjs-monorepo) | `packages/common/src/chains.ts` exports `Mainnet`, `Sepolia`, `Holesky`, `Hoodi` as `ChainConfig`. Each has `hardforks: Array<{ name, block?, timestamp?, forkHash? }>`. Block and timestamp are numbers (or string for timestamp in TS). | TypeScript (in-repo); npm package | 1, 11155111, 17000, 560048 | **Structured.** Consume via `import { Mainnet } from '@ethereumjs/common'` (or fetch raw from GitHub). Includes forkHash. Alternative or supplement to Geth config parsing. |
| **Geth** `params/config.go` | Chain config structs with fork block/timestamp (see Spec 113). | Go | 1, 11155111, 17000, etc. | Current sync script source; requires text extraction. |
| **Nethermind** `Chains/foundation.json` | Fork transitions (e.g. homesteadTransition, blockReward keys) with hex block numbers. | JSON | Mainnet (and possibly other chains in repo) | Alternative EL source; hex decoding needed. See Spec 113. |

### Ethereum consensus layer (CL)

| Source | What | Format | Use |
|--------|------|--------|-----|
| **Beacon API** `GET /eth/v1/config/fork_schedule` | Response `data: [{ previous_version, current_version, epoch }]`. | JSON (HTTP) | Runtime CL schedule. Offered by Chainstack, Tatum, BlockPI, QuickNode, Blast, etc. See specs/113-beacon-fork-sources.md. |

### No fork schedule in package

| Package / API | Content | Fork schedule? |
|---------------|---------|----------------|
| **viem** `viem/chains` | Chain definitions: id, name, nativeCurrency, rpcUrls, blockExplorers, contracts (e.g. multicall3 with `blockCreated`). | **No.** Only contract deployment blocks, not protocol forks. |
| **ethereum-lists/chains** | Per-chain JSON: name, chainId, rpc, explorers, etc. | **No.** |
| **chainid.network** | Aggregated chains from ethereum-lists. | **No.** |

### Optional: eth-forks (npm)

- **eth-forks** (GitHub Aniket-Engg/eth-forks): Lightweight lib to “retrieve Ethereum hardfork details”. Likely wraps a static list or another source; not verified as canonical. Check before using as single source.

---

## Recommendation

1. **Ethereum:** Already specified in Spec 113; sync script exists (Geth + consensus-specs). Add CL forks when `parseConsensusMainnetYaml` is wired (see specs/113-beacon-fork-sources.md).
2. **OP Stack:** Add a sync path that fetches **superchain-registry** `superchain.toml` (mainnet + sepolia), parses `[hardforks]`, and emits fork entries with `activation: { timestamp }` for chainIds 10, 8453, 11155420, 84532. Single source covers all Superchain chains; low churn.
3. **Polygon / Arbitrum / BSC:** No machine-readable canonical source. Either (A) maintain hand-curated JSON per chain family, updated when docs change, or (B) defer fork upgrades UI for these chains until an official or community JSON/API exists.
4. **UI:** Existing `/network/[chainId]/forks` is mainnet-only (FORK_UPGRADES). When schedules.json (or equivalent) includes other chainIds, extend the page to show fork list from schedule for that chain; hide or “Fork upgrades not available” for chains without data.
5. **Manifest:** In `fork-schedules.manifest.json`, record sources per chain or chain family (e.g. `superchain-registry`, `geth`, `consensus-specs`).

---

## References

- Spec 113: Fork and era schedules for explorer context.
- specs/113-beacon-fork-sources.md: CL fork sources (Ethereum).
- npm @ethereumjs/common; github.com/ethereumjs/ethereumjs-monorepo (packages/common/src/chains.ts — Mainnet, Sepolia, Holesky, Hoodi).
- github.com/NethermindEth/nethermind (Chains/foundation.json).
- docs.optimism.io/op-stack/protocol/network-upgrades
- github.com/ethereum-optimism/superchain-registry (superchain/configs mainnet and sepolia; chainList.toml)
- docs.polygon.technology/pos/reference/network-upgrade-process
- github.com/maticnetwork/bor, github.com/maticnetwork/launch (genesis; Bor-native forks in docs only)
- docs.arbitrum.foundation/network-upgrades
- docs.arbitrum.io (ArbOS releases); github.com/OffchainLabs/nitro
- docs.zksync.io/zksync-protocol/upgrades-and-migrations; github.com/matter-labs/zksync-era (CHANGELOG, releases)
- docs.linea.build/release-notes
- docs.scroll.io/technology/overview/scroll-upgrades
- docs.bnbchain.org (Feynman, Lorentz, Fermi, Maxwell announcements)
