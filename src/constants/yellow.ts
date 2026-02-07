/**
 * Yellow Network constants aligned to current docs.
 */

import { ChainId } from '$/constants/networks.ts'

export enum YellowEnvironment {
	Production = 'Production',
	Sandbox = 'Sandbox',
}

export enum YellowChallengePeriodLimit {
	DefaultSeconds = 'DefaultSeconds',
	MinimumSeconds = 'MinimumSeconds',
	MaximumSeconds = 'MaximumSeconds',
}

export type YellowClearnodeEndpoint = {
	environment: YellowEnvironment
	url: string,
}

export type YellowCustodyContract = {
	chainId: ChainId
	address: `0x${string}`,
}

export type YellowAdjudicatorContract = {
	chainId: ChainId
	address: `0x${string}`,
}

export type YellowContractDeployment = {
	chainId: ChainId
	custody: `0x${string}`
	adjudicator: `0x${string}`,
}

export type YellowChallengePeriodLimitEntry = {
	limit: YellowChallengePeriodLimit
	seconds: number,
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
		chainId: ChainId.Ethereum,
		custody: '0x6F71a38d919ad713D0AfE0eB712b95064Fc2616f',
		adjudicator: '0x7de4A0736Cf5740fD3Ca2F2e9cc85c9AC223eF0C',
	},
	{
		chainId: ChainId.Polygon,
		custody: '0x490fb189DdE3a01B00be9BA5F41e3447FbC838b6',
		adjudicator: '0x7de4A0736Cf5740fD3Ca2F2e9cc85c9AC223eF0C',
	},
	{
		chainId: ChainId.Base,
		custody: '0x490fb189DdE3a01B00be9BA5F41e3447FbC838b6',
		adjudicator: '0x7de4A0736Cf5740fD3Ca2F2e9cc85c9AC223eF0C',
	},
	{
		chainId: ChainId.Linea,
		custody: '0x6F71a38d919ad713D0AfE0eB712b95064Fc2616f',
		adjudicator: '0x7de4A0736Cf5740fD3Ca2F2e9cc85c9AC223eF0C',
	},
	{
		chainId: ChainId.EthereumSepolia,
		custody: '0x019B65A265EB3363822f2752141b3dF16131b262',
		adjudicator: '0x019B65A265EB3363822f2752141b3dF16131b262',
	},
	{
		chainId: ChainId.BaseSepolia,
		custody: '0x019B65A265EB3363822f2752141b3dF16131b262',
		adjudicator: '0x019B65A265EB3363822f2752141b3dF16131b262',
	},
	{
		chainId: ChainId.PolygonAmoy,
		custody: '0x019B65A265EB3363822f2752141b3dF16131b262',
		adjudicator: '0x019B65A265EB3363822f2752141b3dF16131b262',
	},
] as const satisfies readonly YellowContractDeployment[]

export const yellowCustodyContracts = yellowContractDeployments.map((d) => ({
	chainId: d.chainId,
	address: d.custody,
})) satisfies readonly YellowCustodyContract[]

export const yellowChallengePeriodLimits = [
	{
		limit: YellowChallengePeriodLimit.DefaultSeconds,
		seconds: 24 * 60 * 60,
	},
	{
		limit: YellowChallengePeriodLimit.MinimumSeconds,
		seconds: 60 * 60,
	},
	{
		limit: YellowChallengePeriodLimit.MaximumSeconds,
		seconds: 7 * 24 * 60 * 60,
	},
] as const satisfies readonly YellowChallengePeriodLimitEntry[]

export const yellowClearnodeEndpointByEnvironment: Partial<
	Record<YellowEnvironment, string>
> = Object.fromEntries(
	yellowClearnodeEndpoints.map((entry) => [entry.environment, entry.url]),
)

export const yellowCustodyContractByChainId: Partial<
	Record<number, `0x${string}`>
> = Object.fromEntries(
	yellowCustodyContracts.map((entry) => [entry.chainId, entry.address]),
)

export const yellowDeploymentByChainId: Partial<
	Record<number, YellowContractDeployment>
> = Object.fromEntries(
	yellowContractDeployments.map((d) => [d.chainId, d]),
)

export const yellowChallengePeriodByLimit: Partial<
	Record<YellowChallengePeriodLimit, number>
> = Object.fromEntries(
	yellowChallengePeriodLimits.map((entry) => [entry.limit, entry.seconds]),
)

export const CUSTODY_CONTRACT_ADDRESS = yellowCustodyContractByChainId

export const CLEARNODE_WS_URL =
	yellowClearnodeEndpointByEnvironment[YellowEnvironment.Production]

export const CLEARNODE_WS_URL_SANDBOX =
	yellowClearnodeEndpointByEnvironment[YellowEnvironment.Sandbox]

export const CHALLENGE_PERIOD =
	yellowChallengePeriodByLimit[YellowChallengePeriodLimit.DefaultSeconds]

export const CHALLENGE_PERIOD_MIN_SECONDS =
	yellowChallengePeriodByLimit[YellowChallengePeriodLimit.MinimumSeconds]

export const CHALLENGE_PERIOD_MAX_SECONDS =
	yellowChallengePeriodByLimit[YellowChallengePeriodLimit.MaximumSeconds]

