# Spec 097: Helios light client integration

Integrate the Helios Ethereum light client as an optional trust-minimized RPC path for supported chains. Helios verifies consensus (sync committee) and execution state via Merkle proofs instead of trusting a single RPC; it can run as a local process or in-browser via WASM.

## Scope

- Support using Helios as the RPC source for Ethereum (and, where applicable, OP Mainnet, Base, Linea) so Voltaire and all existing consumers (collections, gateway, simulation fork source) can use a verified provider when enabled.
- Two integration modes: (1) **local process** — user runs `helios ethereum --execution-rpc $URL`, app points at `http://127.0.0.1:8545`; (2) **in-browser WASM** — use `@a16z/helios` to create an EIP-1193 provider and pass it into the existing Voltaire provider surface.
- Configuration and discovery for Helios (checkpoint, consensus RPC, execution RPC) and clear UX when Helios is selected (sync status, fallback if unreachable).

## Non-goals

- Replacing or duplicating Tevm simulation (Tevm remains the simulation runtime; Helios is an optional verified RPC source for reads and for Tevm fork).
- Supporting Helios for chains Helios does not support (e.g. Arbitrum, Polygon, L2s other than OP Stack and Linea).
- Implementing a full custom light client; we integrate the existing Helios implementation(s).

## Definitions

### Helios (a16z)

Rust multichain light client that converts an untrusted execution RPC into a locally verified RPC by checking sync committee signatures and Merkle proofs. Exposes standard JSON-RPC on a local server (CLI) or as an EIP-1193 provider (WASM via `@a16z/helios`). Requires execution RPC to support `eth_getProof`. Supports Ethereum (mainnet, sepolia, holesky), OP Stack (op-mainnet, base, etc.), Linea.

### VoltaireProvider

Existing type in `src/api/voltaire.ts`: `{ request({ method, params }), on(), removeListener() }` — EIP-1193 compatible. All RPC usage goes through this; Helios (local or WASM) must supply a provider conforming to this interface.

### Trust-minimized RPC

RPC responses that are cryptographically verified by the client (sync committee + state proofs) rather than taken on faith from a single endpoint.

## Background: Helios behavior and requirements

- **Execution RPC:** Must support `eth_getProof`. Recommended: Alchemy, Infura. Public endpoints that omit `eth_getProof` are insufficient.
- **Consensus RPC (Ethereum/OP Stack):** Must support light client beacon API (e.g. Nimbus, or default `https://www.lightclientdata.org`).
- **Checkpoint (Ethereum):** Optional but recommended; beacon block hash of first block of a finalized epoch, &lt; ~2 weeks old. If omitted, fallback URLs can be used (weaker trust).
- **Networks (from @a16z/helios):** Ethereum: `mainnet`, `sepolia`, `holesky`, `hoodi`. OP Stack: `op-mainnet`, `base`, `base-sepolia`, `worldchain`, `zora`, `unichain`. Linea: `linea`, `linea-sepolia`.
- **RPC methods (Helios):** Standard set including `eth_chainId`, `eth_blockNumber`, `eth_getBalance`, `eth_call`, `eth_getLogs`, `eth_getBlockByNumber`, `eth_sendRawTransaction`, `eth_subscribe` (newHeads), etc. See [helios rpc.md](https://github.com/a16z/helios/blob/master/rpc.md). Compatible with current Voltaire usage.
- **In-browser (@a16z/helios):** `createHeliosProvider(config, kind)` with `kind`: `"ethereum"` | `"opstack"` | `"linea"`. Returns EIP-1193 provider; must call `waitSynced()` before use. Config: `executionRpc`, `consensusRpc` (ethereum/opstack), optional `checkpoint`, `network`, `dbType` ("localstorage" | "config"). WASM is loaded automatically by the package.

## Integration modes

### Mode A: Local Helios process

- User installs Helios via `heliosup` and runs e.g. `helios ethereum --execution-rpc $ETH_RPC_URL` (and optionally `--rpc-port`, `--checkpoint`).
- App treats Helios as another RPC endpoint: when user selects "Helios" or "Local light client" for a supported chain, use URL `http://127.0.0.1:8545` (or configured port) for that chain.
- No WASM or `@a16z/helios` dependency required for this mode; `createHttpProvider('http://127.0.0.1:8545')` is sufficient.
- If the local server is unreachable (e.g. Helios not running), fall back to the next configured RPC for that chain and surface a non-blocking notice.

### Mode B: In-browser Helios (WASM)

- Add optional dependency `@a16z/helios`. Create provider with `createHeliosProvider(config, kind)` and await `waitSynced()` before exposing to the app.
- Provider factory: when "Use Helios (browser)" is enabled for a chain, build config from app constants (or user settings): execution RPC (must support `eth_getProof`), consensus RPC, optional checkpoint, network name. Map our `ChainId` to Helios `network` and `kind` (ethereum / opstack / linea).
- Cache the Helios provider per (chainId, config hash) so we do not re-sync on every request. Invalidate on config change or on unreachable errors.
- Expose the result as `VoltaireProvider` (Helios provider already has `request`, `on`, `removeListener`). All existing call sites that receive a provider from a factory continue to work.

## Configuration and constants

- **Chain → Helios mapping:** Maintain a map from `ChainId` to Helios `NetworkKind` and Helios `network` string for supported chains (Ethereum, OP Mainnet, Base, Linea, and their testnets as applicable). Unsupported chains never use Helios.
- **Execution RPC for Helios:** Must be an endpoint that supports `eth_getProof`. Prefer using the same endpoint list as today (e.g. from rpc-endpoints or env) but document that Helios mode requires a proof-capable URL; optionally allow user to set a dedicated "Helios execution RPC" for Ethereum.
- **Consensus RPC / checkpoint:** Default consensus RPC (e.g. `https://www.lightclientdata.org` for mainnet); optional checkpoint from a trusted source (beaconcha.in, or app-default). Checkpoint can be updated periodically (e.g. link to beaconcha.in for latest).
- **Data source (Spec 042):** If we tag entities by RPC source, add `DataSource.Helios` for reads that were served via Helios (local or WASM). Optional and only if we want to distinguish in UI or analytics.

## Provider factory contract

- Today the app derives RPC URL from `rpcUrls[chainId]` and builds provider with `createHttpProvider(url)`. To support Helios without duplicating logic:
  - Introduce a single place that, for a given `chainId`, returns a `VoltaireProvider` (or a Promise thereof for WASM sync). That can be: (1) `createHttpProvider(rpcUrls[chainId])` when Helios is disabled or unsupported for that chain, or (2) for local Helios: `createHttpProvider(HELIOS_LOCAL_URL)` when enabled and chain is supported, or (3) for in-browser Helios: create/cache Helios provider, `waitSynced()`, then return it.
  - Collections and call sites that currently do `createHttpProvider(rpcUrls[chainId])` would instead call this factory (or receive provider from a higher-level context that uses the factory). Exact design (context, store, or function per chain) is left to implementation; the spec only requires that when Helios is enabled for a chain, the provider used for that chain is the Helios-backed one.

## UX and robustness

- **Sync status (WASM):** Until `waitSynced()` resolves, show a loading or "Helios syncing…" state for flows that depend on that chain; do not block the whole app for other chains.
- **Fallback:** If Helios (local or WASM) is unreachable or errors repeatedly, fall back to the default RPC for that chain and optionally show a short notice so the user can fix Helios or disable it.
- **Settings:** Prefer a simple toggle or network-level option: "Use Helios for Ethereum" (and optionally for Base/OP/Linea when we support them). Local mode: "Helios URL" (default `http://127.0.0.1:8545`). Browser mode: require execution RPC with `eth_getProof` (and optionally allow custom consensus RPC / checkpoint in advanced settings).

## Tevm and simulation

- Simulation (Spec 049) forks from an RPC URL. When Helios is the selected RPC for a chain, the fork URL for that chain should be the Helios endpoint (local URL or, for WASM, we cannot fork from in-browser Helios by URL; we would fork from the same execution RPC that Helios uses, or keep simulation on the default RPC). So: for **local** Helios, fork can use `http://127.0.0.1:8545`. For **in-browser** Helios, Tevm fork typically still uses HTTP to an execution RPC; the verified path is only for reads via Helios, not necessarily for the fork. Document this distinction.

## Acceptance criteria

- [ ] Supported chains for Helios are defined (Ethereum mainnet at minimum; optionally sepolia, OP Mainnet, Base, Linea as per Helios support).
- [ ] **Local mode:** When "Use Helios (local)" is enabled for a supported chain, the app uses `http://127.0.0.1:8545` (or a configured URL) as the RPC for that chain; all Voltaire-backed reads and Tevm fork for that chain use this endpoint. If the endpoint is unreachable, fallback to default RPC and surface a notice.
- [ ] **Browser mode (optional):** When "Use Helios (browser)" is enabled for a supported chain, the app creates (or reuses) a Helios provider via `@a16z/helios`, waits for sync, and uses it as the VoltaireProvider for that chain. Sync state is visible; fallback on failure.
- [ ] Configuration: execution RPC used for Helios (and for browser mode, consensus RPC and optional checkpoint) is documented and configurable; requirement for `eth_getProof` is documented.
- [ ] No regression: when Helios is disabled, behavior matches current (rpcUrls + createHttpProvider). Existing tests and e2e pass.
- [ ] Data source: If entity source attribution is extended, Helios-sourced reads are tagged (e.g. `DataSource.Helios`); otherwise this is out of scope.

## TODOs

- Implement provider factory and wire it to rpc-endpoints / settings (local Helios URL, enable/disable per chain).
- Add optional `@a16z/helios` and implement browser-mode provider creation, sync wait, and caching.
- Add ChainId → Helios network/kind mapping and document checkpoint/consensus defaults.
- Decide: settings stored in preferences (Spec 045) or only in-memory/env for hackathon scope.
- E2E: optional test that with a local Helios (or mock) on 8545, app uses it when enabled.

## Sources

- [a16z/helios](https://github.com/a16z/helios) (README, rpc.md, config.md)
- [helios-ts (README)](https://github.com/a16z/helios/tree/master/helios-ts) — `@a16z/helios`, `createHeliosProvider`, EIP-1193
- [helios-ts lib.ts](https://github.com/a16z/helios/blob/master/helios-ts/lib.ts) — Config, NetworkKind, Network, waitSynced
- [Helios browser demo](https://helios.a16zcrypto.com/)
- [Building Helios: Fully trustless access to Ethereum](https://a16zcrypto.com/posts/article/building-helios-ethereum-light-client/)
- [Ethereum light clients (ethereum.org)](https://ethereum.org/developers/docs/nodes-and-clients/light-clients)
- Spec 042 (entity data sources), Spec 049 (transaction simulation Tevm runtime), Spec 045 (schema constants preferences)

## Status

Draft. Not implemented.

## Output when complete

`DONE`
