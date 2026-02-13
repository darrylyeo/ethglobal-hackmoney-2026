import { ercTokens } from '$/constants/coins.ts'
import { ChainId } from '$/constants/networks.ts'
import { EntityType } from '$/data/$EntityType.ts'
import type { Actor$Id } from '$/data/Actor.ts'
import type { Coin$Id } from '$/data/Coin.ts'
import type { Network$Id } from '$/data/Network.ts'

const ethNativeId: Coin$Id = {
	$network: { chainId: ChainId.Ethereum },
	address: '0x0000000000000000000000000000000000000000',
	interopAddress: 'ETH',
}
const usdcEthereum = ercTokens.find(
	(t) => t.chainId === ChainId.Ethereum && t.symbol === 'USDC',
)
const usdcId: Coin$Id = usdcEthereum
	? {
			$network: { chainId: usdcEthereum.chainId },
			address: usdcEthereum.address,
			interopAddress: usdcEthereum.symbol,
		}
	: ethNativeId

const vitalikEthId: Actor$Id = {
	$network: { chainId: ChainId.Ethereum },
	address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
	interopAddress: 'vitalik.eth',
}

export const DEFAULT_WATCHED_ENTITIES: readonly {
	entityType: EntityType.Coin | EntityType.Network | EntityType.Actor
	entityId: Coin$Id | Network$Id | Actor$Id
}[] = [
	{ entityType: EntityType.Network, entityId: { chainId: ChainId.Ethereum } },
	{ entityType: EntityType.Network, entityId: { chainId: ChainId.Base } },
	{ entityType: EntityType.Network, entityId: { chainId: ChainId.EthereumSepolia } },
	{ entityType: EntityType.Network, entityId: { chainId: ChainId.BaseSepolia } },
	{ entityType: EntityType.Coin, entityId: ethNativeId },
	{ entityType: EntityType.Coin, entityId: usdcId },
	{ entityType: EntityType.Actor, entityId: vitalikEthId },
]
