import { CollectionId } from '$/constants/collections.ts'
import { DataSource } from '$/constants/data-sources.ts'
import { EntityType } from '$/data/$EntityType.ts'
import {
	createCollection,
	localStorageCollectionOptions,
} from '@tanstack/svelte-db'
import { parse, stringify } from 'devalue'

export type EntitySourceRow = {
	entityType: EntityType
	source: DataSource
}

const getKey = (row: EntitySourceRow) => `${row.entityType}:${row.source}`

const DEFAULT_ENTITY_SOURCE_COMBOS: EntitySourceRow[] = [
	{ entityType: EntityType.TokenListCoin, source: DataSource.TokenLists },
	{ entityType: EntityType.Coin, source: DataSource.Local },
	{ entityType: EntityType.StorkPrice, source: DataSource.Stork },
	{ entityType: EntityType.ActorCoin, source: DataSource.Voltaire },
	{ entityType: EntityType.ActorAllowance, source: DataSource.Voltaire },
	{ entityType: EntityType.BridgeRoute, source: DataSource.LiFi },
	{ entityType: EntityType.Actor, source: DataSource.Local },
	{ entityType: EntityType.Wallet, source: DataSource.Local },
	{ entityType: EntityType.WalletConnection, source: DataSource.Local },
	{ entityType: EntityType.Network, source: DataSource.Local },
	{ entityType: EntityType.Transaction, source: DataSource.Local },
	{ entityType: EntityType.Block, source: DataSource.Voltaire },
	{ entityType: EntityType.CctpAllowance, source: DataSource.Cctp },
	{ entityType: EntityType.CctpFee, source: DataSource.Cctp },
	{ entityType: EntityType.TransferGraph, source: DataSource.Voltaire },
	{ entityType: EntityType.Room, source: DataSource.PartyKit },
	{ entityType: EntityType.RoomPeer, source: DataSource.PartyKit },
	{ entityType: EntityType.SharedAddress, source: DataSource.PartyKit },
	{ entityType: EntityType.StateChannel, source: DataSource.Eip7824 },
	{ entityType: EntityType.StateChannelState, source: DataSource.Eip7824 },
	{ entityType: EntityType.StateChannelDeposit, source: DataSource.Eip7824 },
	{ entityType: EntityType.StateChannelTransfer, source: DataSource.Eip7824 },
	{ entityType: EntityType.Dashboard, source: DataSource.Local },
	{ entityType: EntityType.SwapQuote, source: DataSource.Uniswap },
	{ entityType: EntityType.UniswapPool, source: DataSource.Uniswap },
	{ entityType: EntityType.UniswapPosition, source: DataSource.Uniswap },
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
