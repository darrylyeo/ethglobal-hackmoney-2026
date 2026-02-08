import { EntityType } from '$/data/$EntityType.ts'

export const DEFAULT_WATCHED_ENTITIES: readonly {
	entityType: EntityType
	id: string
	label: string
	href: string
}[] = [
	{ entityType: EntityType.Coin, id: 'ETH', label: 'ETH', href: '/coin/ETH' },
	{ entityType: EntityType.Coin, id: 'USDC', label: 'USDC', href: '/coin/USDC' },
	{
		entityType: EntityType.Network,
		id: 'ethereum',
		label: 'Ethereum',
		href: '/network/ethereum',
	},
]
