/**
 * Helios light client configuration (spec 097).
 *
 * **Execution RPC (required):** Must support `eth_getProof`. Public RPCs that
 * omit this method are insufficient. Use Alchemy, Infura, or another
 * proof-capable endpoint. When implementing the provider factory, read from
 * env (e.g. HELIOS_EXECUTION_RPC) or app RPC list; allow a dedicated
 * "Helios execution RPC" per chain in settings.
 *
 * **Local mode:** App points at a local Helios process; URL from
 * heliosLocalEndpoints (configurable e.g. via settings when wired).
 *
 * **Browser mode (createHeliosProvider):** Needs executionRpc (eth_getProof),
 * consensusRpc (Ethereum/OP Stack light client beacon API), optional checkpoint
 * (beacon block hash, &lt; ~2 weeks old; see beaconcha.in). Consensus RPC
 * **must allow CORS** when called from the browser; otherwise fetch is blocked.
 *
 * Consensus endpoint list: community-maintained sources (e.g. s1na/light-sync-endpoints).
 * Not a single source of truth; endpoints may be down or not CORS-enabled.
 */

import { HeliosBeaconNetwork } from '$/constants/helios-chains.ts'

export enum HeliosConsensusEndpointId {
	LodestarMainnet = 'lodestar-mainnet',
	NimbusUnstableMainnet = 'nimbus-unstable-mainnet',
	NimbusTestingMainnet = 'nimbus-testing-mainnet',
	LightClientDataMainnet = 'lightclientdata-mainnet',

	LodestarSepolia = 'lodestar-sepolia',
	NimbusUnstableSepolia = 'nimbus-unstable-sepolia',
	LightClientXyzSepolia = 'lightclientxyz-sepolia',

	LodestarHolesky = 'lodestar-holesky',
	NimbusTestingHolesky = 'nimbus-testing-holesky',
	NimbusUnstableHolesky = 'nimbus-unstable-holesky',
	BastinHolesky = 'bastin-holesky',

	LodestarHoodi = 'lodestar-hoodi',
	NimbusUnstableHoodi = 'nimbus-unstable-hoodi',
	NimbusTestingHoodi = 'nimbus-testing-hoodi',
}

export type HeliosConsensusEndpoint = {
	id: HeliosConsensusEndpointId
	network: HeliosBeaconNetwork
	url: string
	/** Safe to use from browser (CORS enabled). HTTP endpoints may be blocked by mixed content. */
	corsBrowser: boolean
	label: string
}

export const heliosConsensusEndpoints = [
	// Mainnet
	{
		id: HeliosConsensusEndpointId.LodestarMainnet,
		network: HeliosBeaconNetwork.Mainnet,
		url: 'https://lodestar-mainnet.chainsafe.io',
		corsBrowser: true,
		label: 'Lodestar (ChainSafe)',
	},
	{
		id: HeliosConsensusEndpointId.NimbusUnstableMainnet,
		network: HeliosBeaconNetwork.Mainnet,
		url: 'http://unstable.mainnet.beacon-api.nimbus.team',
		corsBrowser: false,
		label: 'Nimbus Unstable',
	},
	{
		id: HeliosConsensusEndpointId.NimbusTestingMainnet,
		network: HeliosBeaconNetwork.Mainnet,
		url: 'http://testing.mainnet.beacon-api.nimbus.team',
		corsBrowser: false,
		label: 'Nimbus Testing',
	},
	{
		id: HeliosConsensusEndpointId.LightClientDataMainnet,
		network: HeliosBeaconNetwork.Mainnet,
		url: 'https://www.lightclientdata.org',
		corsBrowser: false,
		label: 'Light Client Data (a16z)',
	},
	// Sepolia
	{
		id: HeliosConsensusEndpointId.LodestarSepolia,
		network: HeliosBeaconNetwork.Sepolia,
		url: 'https://lodestar-sepolia.chainsafe.io',
		corsBrowser: true,
		label: 'Lodestar (ChainSafe)',
	},
	{
		id: HeliosConsensusEndpointId.NimbusUnstableSepolia,
		network: HeliosBeaconNetwork.Sepolia,
		url: 'http://unstable.sepolia.beacon-api.nimbus.team',
		corsBrowser: false,
		label: 'Nimbus Unstable',
	},
	{
		id: HeliosConsensusEndpointId.LightClientXyzSepolia,
		network: HeliosBeaconNetwork.Sepolia,
		url: 'https://sepolia.lightclient.xyz',
		corsBrowser: false,
		label: 'Lightclient.xyz',
	},
	// Holesky
	{
		id: HeliosConsensusEndpointId.LodestarHolesky,
		network: HeliosBeaconNetwork.Holesky,
		url: 'https://lodestar-holesky.chainsafe.io',
		corsBrowser: true,
		label: 'Lodestar (ChainSafe)',
	},
	{
		id: HeliosConsensusEndpointId.NimbusTestingHolesky,
		network: HeliosBeaconNetwork.Holesky,
		url: 'http://testing.holesky.beacon-api.nimbus.team',
		corsBrowser: false,
		label: 'Nimbus Testing',
	},
	{
		id: HeliosConsensusEndpointId.NimbusUnstableHolesky,
		network: HeliosBeaconNetwork.Holesky,
		url: 'http://unstable.holesky.beacon-api.nimbus.team',
		corsBrowser: false,
		label: 'Nimbus Unstable',
	},
	{
		id: HeliosConsensusEndpointId.BastinHolesky,
		network: HeliosBeaconNetwork.Holesky,
		url: 'http://prysm.bastin.io',
		corsBrowser: false,
		label: 'bastin.io (Prysm)',
	},
	// Hoodi
	{
		id: HeliosConsensusEndpointId.LodestarHoodi,
		network: HeliosBeaconNetwork.Hoodi,
		url: 'https://lodestar-hoodi.chainsafe.io',
		corsBrowser: true,
		label: 'Lodestar (ChainSafe)',
	},
	{
		id: HeliosConsensusEndpointId.NimbusUnstableHoodi,
		network: HeliosBeaconNetwork.Hoodi,
		url: 'http://unstable.hoodi.beacon-api.nimbus.team',
		corsBrowser: false,
		label: 'Nimbus Unstable',
	},
	{
		id: HeliosConsensusEndpointId.NimbusTestingHoodi,
		network: HeliosBeaconNetwork.Hoodi,
		url: 'http://testing.hoodi.beacon-api.nimbus.team',
		corsBrowser: false,
		label: 'Nimbus Testing',
	},
] as const satisfies readonly HeliosConsensusEndpoint[]

/** Maps Helios network string (from HELIOS_CHAINS) to beacon network for consensus endpoint lookup. */
export function heliosBeaconNetworkFor(network: string): HeliosBeaconNetwork {
	return (
		network === HeliosBeaconNetwork.Sepolia ||
		network === 'op-sepolia' ||
		network === 'base-sepolia' ||
		network === 'worldchain-sepolia' ||
		network === 'unichain-sepolia' ||
		network === 'linea-sepolia'
			? HeliosBeaconNetwork.Sepolia
			: network === HeliosBeaconNetwork.Holesky
				? HeliosBeaconNetwork.Holesky
				: network === HeliosBeaconNetwork.Hoodi
					? HeliosBeaconNetwork.Hoodi
					: HeliosBeaconNetwork.Mainnet
	)
}

export function heliosConsensusUrlForBrowser(
	beaconNetwork: HeliosBeaconNetwork,
): string {
	const e = heliosConsensusEndpoints.find(
		(x) => x.network === beaconNetwork && x.corsBrowser,
	)
	return e?.url ?? ''
}

export enum HeliosLocalEndpointId {
	Default = 'default',
}

export type HeliosLocalEndpoint = {
	id: HeliosLocalEndpointId
	url: string
	label: string
}

export const heliosLocalEndpoints = [
	{
		id: HeliosLocalEndpointId.Default,
		url: 'http://127.0.0.1:8545',
		label: 'Local (127.0.0.1:8545)',
	},
] as const satisfies readonly HeliosLocalEndpoint[]

/**
 * Checkpoint is optional; when set, use a recent finalized beacon block hash
 * from a trusted source (e.g. beaconcha.in). Improves trust; omit for
 * fallback URLs. To be set per network when implementing browser mode.
 */
export type HeliosCheckpoint = string | undefined
