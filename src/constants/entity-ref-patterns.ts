export enum EntityRefPattern {
	EvmAddress = 'evmAddress',
	EvmBlockNumber = 'evmBlockNumber',
	EvmTransactionHash = 'evmTransactionHash',
	EntityId = 'entityId',
}

export type EntityRefPatternConfig = {
	label: string
	placeholder: string
	pattern: RegExp
	matchComplexity: number
	isHumanReadable: boolean
}

export const entityRefPatternsConfig = {
	[EntityRefPattern.EvmAddress]: {
		label: 'Address',
		placeholder: '0xabcd...6789',
		pattern: /^0x[0-9a-fA-F]{40}$/,
		matchComplexity: 2,
		isHumanReadable: false,
	},
	[EntityRefPattern.EvmBlockNumber]: {
		label: 'Block Number',
		placeholder: '12345678',
		pattern: /^\d+$/,
		matchComplexity: 1,
		isHumanReadable: false,
	},
	[EntityRefPattern.EvmTransactionHash]: {
		label: 'Transaction Hash',
		placeholder: '0xabcdef...456789',
		pattern: /^0x[0-9a-fA-F]{64}$/,
		matchComplexity: 3,
		isHumanReadable: false,
	},
	[EntityRefPattern.EntityId]: {
		label: 'Entity',
		placeholder: 'Block:1:12345',
		pattern: /^[A-Z][a-zA-Z]+:\S+$/,
		matchComplexity: 2,
		isHumanReadable: false,
	},
} as const satisfies Record<EntityRefPattern, EntityRefPatternConfig>

export const matchesEntityRefPattern = (value: string, pattern: EntityRefPattern): boolean => (
	entityRefPatternsConfig[pattern].pattern.test(value)
)
