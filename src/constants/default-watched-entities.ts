import {
	coinInstanceByChainAndCoinId,
	type CoinInstance$Id,
} from '$/constants/coin-instances.ts'
import { CoinId } from '$/constants/coins.ts'
import { ChainId } from '$/constants/networks.ts'
import { EntityType } from '$/data/$EntityType.ts'
import type { Actor$Id } from '$/data/Actor.ts'
import type { Network$Id } from '$/data/Network.ts'

const ethNativeId: CoinInstance$Id = {
	$network: { chainId: ChainId.Ethereum },
}
const usdcInstance = coinInstanceByChainAndCoinId.get(`${ChainId.Ethereum}:${CoinId.USDC}`)
const usdcId: CoinInstance$Id = usdcInstance?.$id ?? ethNativeId

const vitalikEthId: Actor$Id = {
	$network: { chainId: ChainId.Ethereum },
	address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
	interopAddress: 'vitalik.eth',
}

export const DEFAULT_WATCHED_ENTITIES: readonly {
	entityType: EntityType.Coin | EntityType.Network | EntityType.Actor
	entityId: CoinInstance$Id | Network$Id | Actor$Id
}[] = [
	{ entityType: EntityType.Network, entityId: { chainId: ChainId.Ethereum } },
	{ entityType: EntityType.Network, entityId: { chainId: ChainId.Base } },
	{ entityType: EntityType.Network, entityId: { chainId: ChainId.EthereumSepolia } },
	{ entityType: EntityType.Network, entityId: { chainId: ChainId.BaseSepolia } },
	{ entityType: EntityType.Coin, entityId: ethNativeId },
	{ entityType: EntityType.Coin, entityId: usdcId },
	{ entityType: EntityType.Actor, entityId: vitalikEthId },
]
