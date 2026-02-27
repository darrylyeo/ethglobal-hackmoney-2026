/**
 * Yellow Network constants aligned to current docs.
 */

import type { Contract$Id } from '$/data/Contract.ts'
import type { Network$Id } from '$/data/Network.ts'
import { ChainId } from '$/constants/networks.ts'

export enum YellowEnvironment {
	Production = 'Production',
	Sandbox = 'Sandbox',
}

export enum YellowChallengePeriodLimitId {
	DefaultSeconds = 'DefaultSeconds',
	MinimumSeconds = 'MinimumSeconds',
	MaximumSeconds = 'MaximumSeconds',
}

export type YellowClearnodeEndpoint = {
	environment: YellowEnvironment
	url: string,
}

export type YellowContractDeployment = {
	$network: Network$Id
	custody: `0x${string}`
	adjudicator: `0x${string}`
}

export type YellowChallengePeriodLimit = {
	limit: YellowChallengePeriodLimitId
	seconds: number
}

export const yellowClearnodeEndpoints = [
	{
		environment: YellowEnvironment.Production,
		url: 'wss://clearnet.yellow.com/ws',
	},
	{
		environment: YellowEnvironment.Sandbox,
		url: 'wss://clearnet-sandbox.yellow.com/ws',
	},
] as const satisfies readonly YellowClearnodeEndpoint[]

export const yellowContractDeployments = [
	{
		$network: { chainId: ChainId.Ethereum },
		custody: '0x6F71a38d919ad713D0AfE0eB712b95064Fc2616f',
		adjudicator: '0x7de4A0736Cf5740fD3Ca2F2e9cc85c9AC223eF0C',
	},
	{
		$network: { chainId: ChainId.Polygon },
		custody: '0x490fb189DdE3a01B00be9BA5F41e3447FbC838b6',
		adjudicator: '0x7de4A0736Cf5740fD3Ca2F2e9cc85c9AC223eF0C',
	},
	{
		$network: { chainId: ChainId.Base },
		custody: '0x490fb189DdE3a01B00be9BA5F41e3447FbC838b6',
		adjudicator: '0x7de4A0736Cf5740fD3Ca2F2e9cc85c9AC223eF0C',
	},
	{
		$network: { chainId: ChainId.Linea },
		custody: '0x6F71a38d919ad713D0AfE0eB712b95064Fc2616f',
		adjudicator: '0x7de4A0736Cf5740fD3Ca2F2e9cc85c9AC223eF0C',
	},
	{
		$network: { chainId: ChainId.EthereumSepolia },
		custody: '0x019B65A265EB3363822f2752141b3dF16131b262',
		adjudicator: '0x019B65A265EB3363822f2752141b3dF16131b262',
	},
	{
		$network: { chainId: ChainId.BaseSepolia },
		custody: '0x019B65A265EB3363822f2752141b3dF16131b262',
		adjudicator: '0x019B65A265EB3363822f2752141b3dF16131b262',
	},
	{
		$network: { chainId: ChainId.PolygonAmoy },
		custody: '0x019B65A265EB3363822f2752141b3dF16131b262',
		adjudicator: '0x019B65A265EB3363822f2752141b3dF16131b262',
	},
] as const satisfies readonly YellowContractDeployment[]

export const yellowCustodyContracts: readonly Contract$Id[] =
	yellowContractDeployments.map((d) => ({
		$network: d.$network,
		address: d.custody,
	}))

export const yellowChallengePeriodLimits = [
	{
		limit: YellowChallengePeriodLimitId.DefaultSeconds,
		seconds: 24 * 60 * 60,
	},
	{
		limit: YellowChallengePeriodLimitId.MinimumSeconds,
		seconds: 60 * 60,
	},
	{
		limit: YellowChallengePeriodLimitId.MaximumSeconds,
		seconds: 7 * 24 * 60 * 60,
	},
] as const satisfies readonly YellowChallengePeriodLimit[]

export const yellowClearnodeEndpointByEnvironment: Partial<
	Record<YellowEnvironment, string>
> = Object.fromEntries(
	yellowClearnodeEndpoints.map((entry) => [entry.environment, entry.url]),
)

export const yellowCustodyContractByChainId: Partial<
	Record<number, `0x${string}`>
> = Object.fromEntries(
	yellowCustodyContracts.map((c) => [c.$network.chainId, c.address]),
)

export const yellowDeploymentByChainId: Partial<
	Record<number, YellowContractDeployment>
> = Object.fromEntries(
	yellowContractDeployments.map((d) => [d.$network.chainId, d]),
)

export const yellowChallengePeriodByLimit: Partial<
	Record<YellowChallengePeriodLimitId, number>
> = Object.fromEntries(
	yellowChallengePeriodLimits.map((entry) => [entry.limit, entry.seconds]),
)

export const CUSTODY_CONTRACT_ADDRESS = yellowCustodyContractByChainId

export const CLEARNODE_WS_URL =
	yellowClearnodeEndpointByEnvironment[YellowEnvironment.Production]

export const CLEARNODE_WS_URL_SANDBOX =
	yellowClearnodeEndpointByEnvironment[YellowEnvironment.Sandbox]

export const CHALLENGE_PERIOD =
	yellowChallengePeriodByLimit[YellowChallengePeriodLimitId.DefaultSeconds]

export const CHALLENGE_PERIOD_MIN_SECONDS =
	yellowChallengePeriodByLimit[YellowChallengePeriodLimitId.MinimumSeconds]

export const CHALLENGE_PERIOD_MAX_SECONDS =
	yellowChallengePeriodByLimit[YellowChallengePeriodLimitId.MaximumSeconds]

