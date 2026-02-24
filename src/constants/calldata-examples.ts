/**
 * Example calldata for the calldata decoder (selector + ABI-encoded args).
 * Used for "Load example" dropdown and e2e tests.
 */

export type CalldataExample = {
	id: string
	label: string
	hex: `0x${string}`
}

export const calldataExamples: readonly CalldataExample[] = [
	{
		id: 'transfer',
		label: 'ERC20 transfer(address,uint256)',
		hex: '0xa9059cbb0000000000000000000000007432f2e8c2e2e8c2e2e8c2e2e8c2e2e8c2e2e8c2000000000000000000000000000000000000000000000000000de0b6b3a7640000',
	},
	{
		id: 'approve',
		label: 'ERC20 approve(address,uint256)',
		hex: '0x095ea7b30000000000000000000000007432f2e8c2e2e8c2e2e8c2e2e8c2e2e8c2e2e8c2ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
	},
	{
		id: 'balanceOf',
		label: 'ERC20 balanceOf(address)',
		hex: '0x70a082310000000000000000000000007432f2e8c2e2e8c2e2e8c2e2e8c2e2e8c2e2e8c2',
	},
] as const

export const calldataExampleById = Object.fromEntries(
	calldataExamples.map((e) => [e.id, e]),
) as Record<(typeof calldataExamples)[number]['id'], (typeof calldataExamples)[number]>
