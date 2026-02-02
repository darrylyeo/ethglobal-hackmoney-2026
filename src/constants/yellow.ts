/**
 * Yellow Network / Nitrolite: Custody Contract and Clearnode endpoints.
 * Contract addresses: populate from Yellow docs when deploying.
 */

import { ChainId } from '$/constants/networks'

type Address = `0x${string}`

export enum YellowResource {
	CustodyContract = 'CustodyContract',
	ClearnodeWsUrl = 'ClearnodeWsUrl',
}

export type YellowResourceEntry = {
	chainId: ChainId
	resource: YellowResource
	value: string
}

const placeholderAddress: Address = '0x0000000000000000000000000000000000000000'

export const yellowResources = [
	{
		chainId: ChainId.Ethereum,
		resource: YellowResource.CustodyContract,
		value: placeholderAddress,
	},
	{
		chainId: ChainId.Optimism,
		resource: YellowResource.CustodyContract,
		value: placeholderAddress,
	},
	{
		chainId: ChainId.Arbitrum,
		resource: YellowResource.CustodyContract,
		value: placeholderAddress,
	},
	{
		chainId: ChainId.Base,
		resource: YellowResource.CustodyContract,
		value: placeholderAddress,
	},
	{
		chainId: ChainId.Ethereum,
		resource: YellowResource.ClearnodeWsUrl,
		value: 'wss://clearnet.yellow.com/ws',
	},
	{
		chainId: ChainId.Optimism,
		resource: YellowResource.ClearnodeWsUrl,
		value: 'wss://clearnet.yellow.com/ws',
	},
	{
		chainId: ChainId.Arbitrum,
		resource: YellowResource.ClearnodeWsUrl,
		value: 'wss://clearnet.yellow.com/ws',
	},
	{
		chainId: ChainId.Base,
		resource: YellowResource.ClearnodeWsUrl,
		value: 'wss://clearnet.yellow.com/ws',
	},
] as const satisfies readonly YellowResourceEntry[]

const yellowResourcesByType = (
	Object.fromEntries(
		Map.groupBy(yellowResources, (entry) => entry.resource)
			.entries()
			.map(([resource, entries]) => [
				resource,
				Object.fromEntries(entries.map((entry) => [entry.chainId, entry.value])),
			])
	)
)

export const CUSTODY_CONTRACT_ADDRESS = yellowResourcesByType[YellowResource.CustodyContract]
export const CLEARNODE_WS_URL = yellowResourcesByType[YellowResource.ClearnodeWsUrl]
export const CLEARNODE_WS_URL_SANDBOX = 'wss://clearnet-sandbox.yellow.com/ws'

export const CHALLENGE_PERIOD = 60 * 60

export const MIN_CHANNEL_DEPOSIT = 10n * 10n ** 6n
