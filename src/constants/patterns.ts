export enum PatternType {
	EvmAddress = 'EvmAddress',
	EvmBlockNumber = 'EvmBlockNumber',
	EvmTransactionHash = 'EvmTransactionHash',
	EntityId = 'EntityId',
}

export type PatternConfig = {
	type: PatternType
	label: string
	placeholder: string
	pattern: RegExp
	matchComplexity: number
	isHumanReadable: boolean
}

export const patterns: PatternConfig[] = [
	{
		type: PatternType.EvmAddress,
		label: 'Address',
		placeholder: '0xabcd...6789',
		pattern: /^0x[0-9a-fA-F]{40}$/,
		matchComplexity: 2,
		isHumanReadable: false,
	},
	{
		type: PatternType.EvmBlockNumber,
		label: 'Block Number',
		placeholder: '12345678',
		pattern: /^\d+$/,
		matchComplexity: 1,
		isHumanReadable: false,
	},
	{
		type: PatternType.EvmTransactionHash,
		label: 'Transaction Hash',
		placeholder: '0xabcdef...456789',
		pattern: /^0x[0-9a-fA-F]{64}$/,
		matchComplexity: 3,
		isHumanReadable: false,
	},
	{
		type: PatternType.EntityId,
		label: 'Entity',
		placeholder: 'Block:1:12345',
		pattern: /^[A-Z][a-zA-Z]+:\S+$/,
		matchComplexity: 2,
		isHumanReadable: false,
	},
]

export const patternByPatternType = Object.fromEntries(
	patterns.map((p) => [p.type, p]),
) as Record<PatternType, PatternConfig>
