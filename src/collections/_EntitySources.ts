import { CollectionId } from '$/constants/collections.ts'
import { DataSourceId } from '$/constants/data-sources.ts'
import { EntityType } from '$/data/$EntityType.ts'
import {
	createCollection,
	localStorageCollectionOptions,
} from '@tanstack/svelte-db'
import { parse, stringify } from 'devalue'

export type EntitySourceRow = {
	entityType: EntityType
	source: DataSourceId
}

const getKey = (row: EntitySourceRow) => `${row.entityType}:${row.source}`

const DEFAULT_ENTITY_SOURCE_COMBOS: EntitySourceRow[] = [
	{ entityType: EntityType.TokenListCoin, source: DataSourceId.TokenLists },
	{ entityType: EntityType.Coin, source: DataSourceId.Local },
	{ entityType: EntityType.StorkPrice, source: DataSourceId.Stork },
	{ entityType: EntityType.ActorCoin, source: DataSourceId.Voltaire },
	{ entityType: EntityType.ActorAllowance, source: DataSourceId.Voltaire },
	{ entityType: EntityType.BridgeRoute, source: DataSourceId.LiFi },
	{ entityType: EntityType.Actor, source: DataSourceId.Local },
	{ entityType: EntityType.Wallet, source: DataSourceId.Local },
	{ entityType: EntityType.WalletConnection, source: DataSourceId.Local },
	{ entityType: EntityType.Network, source: DataSourceId.Local },
	{ entityType: EntityType.Transaction, source: DataSourceId.Local },
	{ entityType: EntityType.Block, source: DataSourceId.Voltaire },
	{ entityType: EntityType.CctpAllowance, source: DataSourceId.Cctp },
	{ entityType: EntityType.CctpFee, source: DataSourceId.Cctp },
	{ entityType: EntityType.TransferGraph, source: DataSourceId.Voltaire },
	{ entityType: EntityType.Room, source: DataSourceId.PartyKit },
	{ entityType: EntityType.RoomPeer, source: DataSourceId.PartyKit },
	{ entityType: EntityType.SharedAddress, source: DataSourceId.PartyKit },
	{ entityType: EntityType.StateChannel, source: DataSourceId.Eip7824 },
	{ entityType: EntityType.StateChannelState, source: DataSourceId.Eip7824 },
	{ entityType: EntityType.StateChannelDeposit, source: DataSourceId.Eip7824 },
	{ entityType: EntityType.StateChannelTransfer, source: DataSourceId.Eip7824 },
	{ entityType: EntityType.Dashboard, source: DataSourceId.Local },
	{ entityType: EntityType.SwapQuote, source: DataSourceId.Uniswap },
	{ entityType: EntityType.UniswapPool, source: DataSourceId.Uniswap },
	{ entityType: EntityType.UniswapPosition, source: DataSourceId.Uniswap },
]

export const entitySourcesCollection = createCollection(
	localStorageCollectionOptions({
		id: CollectionId.EntitySources,
		storageKey: CollectionId.EntitySources,
		getKey,
		parser: { stringify, parse },
	}),
)

for (const combo of DEFAULT_ENTITY_SOURCE_COMBOS) {
	const key = getKey(combo)
	if (!entitySourcesCollection.state.get(key))
		entitySourcesCollection.insert(combo)
}
