import type { ConsensusProtocol, ExecutionProtocol } from '$/data/fork-schedules/types.ts'

/**
 * Ethereum mainnet fork upgrades: name, activation, links, and included EIP numbers.
 * Sources: ethereum.org/ethereum-forks, ethereum/execution-specs, ethereum/consensus-specs, ethereumjs/common.
 */

export type ForkUpgrade = {
	name: string
	slug: string
	activationBlock?: number
	activationTimestamp?: number
	links: {
		ethereumOrg?: string
		executionSpecs?: string
		consensusSpecs?: string
		forkcast?: string
	}
	eipNumbers: number[]
	executionProtocol?: ExecutionProtocol
	consensusProtocol?: ConsensusProtocol
}

/** Activation timestamps in ForkUpgrade / ForkActivation are Unix seconds. Use for display. */
export const dateFromUnixSeconds = (
	t: number | undefined | null,
): Date | null => (t != null ? new Date(t * 1000) : null)

const EXECUTION_SPECS_BASE =
	'https://github.com/ethereum/execution-specs/blob/master/network-upgrades/mainnet-upgrades'
const CONSENSUS_SPECS_BASE = 'https://github.com/ethereum/consensus-specs/blob/master/specs'
const FORKCAST_URL = 'https://forkcast.org'

export const FORK_UPGRADES = [
	{
		name: 'Osaka',
		slug: 'osaka',
		activationTimestamp: 1764798551,
		links: {
			ethereumOrg: 'https://ethereum.org/ethereum-forks/#fusaka',
			executionSpecs: `${EXECUTION_SPECS_BASE}/fusaka.md`,
			forkcast: FORKCAST_URL,
		},
		eipNumbers: [7594, 7823, 7825, 7883, 7892, 7939, 7951, 7918],
	},
	{
		name: 'Prague',
		slug: 'prague',
		activationTimestamp: 1746612311,
		links: {
			ethereumOrg: 'https://ethereum.org/ethereum-forks/#pectra',
			executionSpecs: `${EXECUTION_SPECS_BASE}/prague.md`,
			consensusSpecs: `${CONSENSUS_SPECS_BASE}/electra/`,
			forkcast: FORKCAST_URL,
		},
		eipNumbers: [2537, 2935, 6110, 7002, 7251, 7623, 7685, 7691, 7702],
	},
	{
		name: 'Cancun',
		slug: 'cancun',
		activationTimestamp: 1710338135,
		links: {
			ethereumOrg: 'https://ethereum.org/ethereum-forks/#dencun',
			executionSpecs: `${EXECUTION_SPECS_BASE}/cancun.md`,
			consensusSpecs: `${CONSENSUS_SPECS_BASE}/deneb/`,
			forkcast: FORKCAST_URL,
		},
		eipNumbers: [1153, 4844, 4788, 5656, 6780, 7516],
	},
	{
		name: 'Shanghai',
		slug: 'shanghai',
		activationTimestamp: 1681338455,
		links: {
			ethereumOrg: 'https://ethereum.org/ethereum-forks/#shapella',
			executionSpecs: `${EXECUTION_SPECS_BASE}/shanghai.md`,
			consensusSpecs: `${CONSENSUS_SPECS_BASE}/capella/`,
			forkcast: FORKCAST_URL,
		},
		eipNumbers: [3651, 3855, 3860, 4895],
	},
	{
		name: 'Paris',
		slug: 'paris',
		activationBlock: 15_537_394,
		links: {
			ethereumOrg: 'https://ethereum.org/ethereum-forks/#paris',
			executionSpecs: `${EXECUTION_SPECS_BASE}/merge.md`,
			consensusSpecs: `${CONSENSUS_SPECS_BASE}/bellatrix/`,
			forkcast: FORKCAST_URL,
		},
		eipNumbers: [3675, 4399],
	},
	{
		name: 'Gray Glacier',
		slug: 'gray-glacier',
		activationBlock: 15_050_000,
		links: {
			ethereumOrg: 'https://ethereum.org/ethereum-forks/#gray-glacier',
			executionSpecs: `${EXECUTION_SPECS_BASE}/gray-glacier.md`,
			forkcast: FORKCAST_URL,
		},
		eipNumbers: [5133],
	},
	{
		name: 'Arrow Glacier',
		slug: 'arrow-glacier',
		activationBlock: 13_773_000,
		links: {
			ethereumOrg: 'https://ethereum.org/ethereum-forks/#arrow-glacier',
			executionSpecs: `${EXECUTION_SPECS_BASE}/arrow-glacier.md`,
			forkcast: FORKCAST_URL,
		},
		eipNumbers: [4345],
	},
	{
		name: 'London',
		slug: 'london',
		activationBlock: 12_965_000,
		links: {
			ethereumOrg: 'https://ethereum.org/ethereum-forks/#london',
			executionSpecs: `${EXECUTION_SPECS_BASE}/london.md`,
			forkcast: FORKCAST_URL,
		},
		eipNumbers: [1559, 3198, 3529, 3541],
	},
	{
		name: 'Berlin',
		slug: 'berlin',
		activationBlock: 12_244_000,
		links: {
			ethereumOrg: 'https://ethereum.org/ethereum-forks/#berlin',
			executionSpecs: `${EXECUTION_SPECS_BASE}/berlin.md`,
			forkcast: FORKCAST_URL,
		},
		eipNumbers: [2565, 2929, 2718, 2930],
	},
	{
		name: 'Muir Glacier',
		slug: 'muir-glacier',
		activationBlock: 9_200_000,
		links: {
			ethereumOrg: 'https://ethereum.org/ethereum-forks/#muir-glacier',
			executionSpecs: `${EXECUTION_SPECS_BASE}/muir-glacier.md`,
			forkcast: FORKCAST_URL,
		},
		eipNumbers: [2384],
	},
	{
		name: 'Istanbul',
		slug: 'istanbul',
		activationBlock: 9_069_000,
		links: {
			ethereumOrg: 'https://ethereum.org/ethereum-forks/#istanbul',
			executionSpecs: `${EXECUTION_SPECS_BASE}/istanbul.md`,
			forkcast: FORKCAST_URL,
		},
		eipNumbers: [1679],
	},
	{
		name: 'Constantinople',
		slug: 'constantinople',
		activationBlock: 7_280_000,
		links: {
			ethereumOrg: 'https://ethereum.org/ethereum-forks/#constantinople',
			executionSpecs: `${EXECUTION_SPECS_BASE}/constantinople.md`,
			forkcast: FORKCAST_URL,
		},
		eipNumbers: [1013],
	},
	{
		name: 'Petersburg',
		slug: 'petersburg',
		activationBlock: 7_280_000,
		links: {
			ethereumOrg: 'https://ethereum.org/ethereum-forks/#constantinople',
			executionSpecs: `${EXECUTION_SPECS_BASE}/petersburg.md`,
			forkcast: FORKCAST_URL,
		},
		eipNumbers: [1716],
	},
	{
		name: 'Byzantium',
		slug: 'byzantium',
		activationBlock: 4_370_000,
		links: {
			ethereumOrg: 'https://ethereum.org/ethereum-forks/#byzantium',
			executionSpecs: `${EXECUTION_SPECS_BASE}/byzantium.md`,
			forkcast: FORKCAST_URL,
		},
		eipNumbers: [609],
	},
	{
		name: 'Spurious Dragon',
		slug: 'spurious-dragon',
		activationBlock: 2_675_000,
		links: {
			ethereumOrg: 'https://ethereum.org/ethereum-forks/#spurious-dragon',
			executionSpecs: `${EXECUTION_SPECS_BASE}/spurious-dragon.md`,
			forkcast: FORKCAST_URL,
		},
		eipNumbers: [607],
	},
	{
		name: 'Tangerine Whistle',
		slug: 'tangerine-whistle',
		activationBlock: 2_463_000,
		links: {
			ethereumOrg: 'https://ethereum.org/ethereum-forks/#tangerine-whistle',
			executionSpecs: `${EXECUTION_SPECS_BASE}/tangerine-whistle.md`,
			forkcast: FORKCAST_URL,
		},
		eipNumbers: [608],
	},
	{
		name: 'DAO',
		slug: 'dao',
		activationBlock: 1_920_000,
		links: {
			ethereumOrg: 'https://ethereum.org/ethereum-forks/#dao-fork',
			executionSpecs: `${EXECUTION_SPECS_BASE}/dao-fork.md`,
			forkcast: FORKCAST_URL,
		},
		eipNumbers: [],
	},
	{
		name: 'Homestead',
		slug: 'homestead',
		activationBlock: 1_150_000,
		links: {
			ethereumOrg: 'https://ethereum.org/ethereum-forks/#homestead',
			executionSpecs: `${EXECUTION_SPECS_BASE}/homestead.md`,
			forkcast: FORKCAST_URL,
		},
		eipNumbers: [606],
	},
	{
		name: 'Frontier Thawing',
		slug: 'frontier-thawing',
		activationBlock: 200_000,
		links: {
			ethereumOrg: 'https://ethereum.org/ethereum-forks/#frontier-thawing',
			forkcast: FORKCAST_URL,
		},
		eipNumbers: [],
	},
	{
		name: 'Frontier',
		slug: 'frontier',
		activationBlock: 0,
		links: {
			ethereumOrg: 'https://ethereum.org/ethereum-forks/#frontier',
			forkcast: FORKCAST_URL,
		},
		eipNumbers: [1],
	},
] as const satisfies readonly ForkUpgrade[]

export function getForkSlugByEraName(eraName: string): string | null {
	const n = eraName.toLowerCase().replace(/\s+/g, '')
	const f = FORK_UPGRADES.find(
		(x) => x.name.toLowerCase().replace(/\s+/g, '') === n,
	)
	return f?.slug ?? null
}

export const EIPS_OFFICIAL_BASE = 'https://eips.ethereum.org/EIPS/eip-'
