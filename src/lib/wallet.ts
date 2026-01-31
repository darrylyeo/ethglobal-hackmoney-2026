import { createWalletClient, custom } from 'viem'
import type { Chain, Client } from 'viem'
import { networksByChainId } from '$/constants/networks'

export type EIP1193Provider = {
	request(args: { method: string; params?: unknown[] }): Promise<unknown>
}

export type ProviderDetailType = {
	info: Readonly<{ uuid: string; name: string; icon: string; rdns: string }>
	provider: EIP1193Provider
}

export type WalletState = {
	providers: ProviderDetailType[]
	connectedDetail: ProviderDetailType | null
	address: `0x${string}` | null
	isTestnet: boolean
	isConnecting: boolean
	error: string | null
}

const PROVIDER_ANNOUNCE = 'eip6963:announceProvider'
const PROVIDER_REQUEST = 'eip6963:requestProvider'

const MINIMAL_CHAINS = new Map<number, Chain>(
	Object.entries(networksByChainId).map(([idStr, n]) => [
		Number(idStr),
		{
			id: n.id,
			name: n.name,
			nativeCurrency: { decimals: 18, name: 'Ether', symbol: 'ETH' },
			rpcUrls: { default: { http: [] } },
		} as Chain,
	]),
)

function chainFor(chainId: number): Chain {
	const c = MINIMAL_CHAINS.get(chainId)
	return c
		?? ({
			id: chainId,
			name: `Chain ${chainId}`,
			nativeCurrency: { decimals: 18, name: 'Ether', symbol: 'ETH' },
			rpcUrls: { default: { http: [] } },
		} as Chain)
}

export function subscribeProviders(listener: (providers: ProviderDetailType[]) => void): () => void {
	const byUuid = new Map<string, ProviderDetailType>()
	const notify = () => listener([...byUuid.values()])

	function handleAnnounce(e: Event) {
		const { detail } = e as CustomEvent<ProviderDetailType>
		if (detail?.info?.uuid && detail?.provider?.request) {
			byUuid.set(detail.info.uuid, { info: detail.info, provider: detail.provider })
			notify()
		}
	}

	if (typeof window === 'undefined') return () => {}
	window.addEventListener(PROVIDER_ANNOUNCE, handleAnnounce)
	window.dispatchEvent(new Event(PROVIDER_REQUEST))
	return () => window.removeEventListener(PROVIDER_ANNOUNCE, handleAnnounce)
}

export async function connectProvider(detail: ProviderDetailType): Promise<`0x${string}`> {
	const accounts = (await detail.provider.request({
		method: 'eth_requestAccounts',
		params: [],
	})) as string[]
	const addr = accounts[0]
	if (!addr || !addr.startsWith('0x')) throw new Error('No account returned')
	return addr as `0x${string}`
}

export function createWalletClientForChain(provider: EIP1193Provider, chainId: number): Client {
	return createWalletClient({
		chain: chainFor(chainId),
		transport: custom(provider),
	})
}

export async function switchWalletChain(provider: EIP1193Provider, chainId: number): Promise<void> {
	await provider.request({
		method: 'wallet_switchEthereumChain',
		params: [{ chainId: `0x${chainId.toString(16)}` }],
	})
}

export function createWalletState(): WalletState {
	return {
		providers: [],
		connectedDetail: null,
		address: null,
		isTestnet: false,
		isConnecting: false,
		error: null,
	}
}
