/**
 * Yellow Network constants aligned to current docs.
 */

import { ChainId } from '$/constants/networks'

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
	url: string
}

export type YellowCustodyContract = {
	chainId: ChainId
	address: `0x${string}`
}

export type YellowChallengePeriodLimitEntry = {
	limit: YellowChallengePeriodLimit
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

// TODO: populate custody contract deployments when published by Yellow.
export const yellowCustodyContracts = [
] as const satisfies readonly YellowCustodyContract[]

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
	yellowClearnodeEndpoints.map((entry) => [
		entry.environment,
		entry.url,
	]),
)

export const yellowCustodyContractByChainId: Partial<
	Record<ChainId, `0x${string}`>
> = Object.fromEntries(
	yellowCustodyContracts.map((entry) => [entry.chainId, entry.address]),
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
