/**
 * Yellow Network resources shared across constants.
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

export const yellowResourcesByType = Object.fromEntries(
	Map.groupBy(yellowResources, (entry) => entry.resource)
		.entries()
		.map(([resource, entries]) => [
			resource,
			Object.fromEntries(entries.map((entry) => [entry.chainId, entry.value])),
		]),
)
