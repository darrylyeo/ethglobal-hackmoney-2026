import { encodeFunction, decodeParameters } from '@tevm/voltaire/Abi'
import { toBytes } from '@tevm/voltaire/Hex'

export type VoltaireProvider = {
	request: (args: { method: string; params?: unknown[] }) => Promise<unknown>
	on: (event: string, listener: () => void) => VoltaireProvider
	removeListener: (event: string, listener: () => void) => VoltaireProvider
}

const ERC20_BALANCE_OF_ABI = [
	{
		type: 'function' as const,
		name: 'balanceOf',
		stateMutability: 'view' as const,
		inputs: [{ type: 'address', name: 'account' }],
		outputs: [{ type: 'uint256', name: '' }],
	},
] as const

const BALANCE_OF_OUTPUTS = [{ type: 'uint256' as const, name: '' }] as const

export function getChainId(provider: VoltaireProvider): Promise<bigint> {
	return provider
		.request({ method: 'eth_chainId', params: [] })
		.then((res) => (typeof res === 'string' ? BigInt(res) : BigInt(res as string)))
}

export function encodeBalanceOfCall(account: `0x${string}`): `0x${string}` {
	return encodeFunction(ERC20_BALANCE_OF_ABI, 'balanceOf', [account]) as `0x${string}`
}

export function decodeBalanceOfResult(hex: string): bigint {
	const bytes = toBytes(hex as `0x${string}`)
	const [balance] = decodeParameters(BALANCE_OF_OUTPUTS, bytes) as [bigint]
	return balance
}

export async function getErc20Balance(
	provider: VoltaireProvider,
	contractAddress: `0x${string}`,
	accountAddress: `0x${string}`,
): Promise<bigint> {
	const data = encodeBalanceOfCall(accountAddress)
	const res = await provider.request({
		method: 'eth_call',
		params: [
			{ to: contractAddress, data },
			'latest',
		],
	})
	if (typeof res !== 'string' || !res) throw new Error('eth_call returned invalid data')
	return decodeBalanceOfResult(res)
}

export async function createHttpProvider(url: string): Promise<VoltaireProvider> {
	const { HttpProvider } = await import('@tevm/voltaire/provider')
	return new HttpProvider({ url }) as VoltaireProvider
}
