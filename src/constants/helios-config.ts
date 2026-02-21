/**
 * Helios light client configuration (spec 097).
 *
 * **Execution RPC (required):** Must support `eth_getProof`. Public RPCs that
 * omit this method are insufficient. Use Alchemy, Infura, or another
 * proof-capable endpoint. When implementing the provider factory, read from
 * env (e.g. HELIOS_EXECUTION_RPC) or app RPC list; allow a dedicated
 * "Helios execution RPC" per chain in settings.
 *
 * **Local mode:** App points at a local Helios process. Default URL below;
 * make configurable (e.g. HELIOS_LOCAL_URL or settings) when wiring.
 *
 * **Browser mode (createHeliosProvider):** Needs executionRpc (eth_getProof),
 * consensusRpc (Ethereum/OP Stack light client beacon API), optional checkpoint
 * (beacon block hash, &lt; ~2 weeks old; see beaconcha.in). Consensus default
 * below; checkpoint can be updated from trusted source.
 */

/** Default URL for local Helios process (e.g. `helios ethereum --rpc-port 8545`). */
export const HELIOS_LOCAL_DEFAULT_URL = 'http://127.0.0.1:8545'

/**
 * Default consensus RPC for Ethereum/OP Stack browser mode.
 * Must support light client beacon API (e.g. Nimbus).
 */
export const HELIOS_CONSENSUS_RPC_DEFAULT = 'https://www.lightclientdata.org'

/**
 * Checkpoint is optional; when set, use a recent finalized beacon block hash
 * from a trusted source (e.g. beaconcha.in). Improves trust; omit for
 * fallback URLs. To be set per network when implementing browser mode.
 */
export type HeliosCheckpoint = string | undefined
