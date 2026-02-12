import { ercTokens } from '$/constants/coins.ts'
import { ChainId } from '$/constants/networks.ts'
import { EntityType } from '$/data/$EntityType.ts'
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

export const DEFAULT_WATCHED_ENTITIES: readonly {
	entityType: EntityType.Coin | EntityType.Network
	entityId: Coin$Id | Network$Id
}[] = [
	{ entityType: EntityType.Coin, entityId: ethNativeId },
	{ entityType: EntityType.Coin, entityId: usdcId },
	{ entityType: EntityType.Network, entityId: { chainId: ChainId.Ethereum } },
]
