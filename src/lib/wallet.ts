import { createWalletClient, custom } from 'viem'
import type { Chain, Client } from 'viem'
import { networksByChainId } from '$/constants/networks'
import { getChainConfig } from '$/constants/chain-configs'

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
	chainId: number | null
	isTestnet: boolean
	isConnecting: boolean
	error: string | null
}

export const getWalletChainId = async (provider: EIP1193Provider): Promise<number> => {
	const chainIdHex = (await provider.request({
		method: 'eth_chainId',
		params: [],
	})) as string
	return parseInt(chainIdHex, 16)
}

export const subscribeChainChanged = (
	provider: EIP1193Provider,
	callback: (chainId: number) => void,
): (() => void) => {
	const handler = (chainIdHex: string) => {
		callback(parseInt(chainIdHex, 16))
	}
	if ('on' in provider && typeof (provider as { on?: (event: string, cb: (v: string) => void) => void }).on === 'function') {
		(provider as { on: (event: string, cb: (v: string) => void) => void }).on('chainChanged', handler)
		return () => {
			if ('removeListener' in provider && typeof (provider as { removeListener?: (event: string, cb: (v: string) => void) => void }).removeListener === 'function') {
				(provider as { removeListener: (event: string, cb: (v: string) => void) => void }).removeListener('chainChanged', handler)
			}
		}
	}
	return () => {}
}

export const subscribeAccountsChanged = (
	provider: EIP1193Provider,
	callback: (accounts: `0x${string}`[]) => void,
): (() => void) => {
	const handler = (accounts: string[]) => {
		callback(accounts.filter((a) => a.startsWith('0x')) as `0x${string}`[])
	}
	if ('on' in provider && typeof (provider as { on?: (event: string, cb: (v: string[]) => void) => void }).on === 'function') {
		(provider as { on: (event: string, cb: (v: string[]) => void) => void }).on('accountsChanged', handler)
		return () => {
			if ('removeListener' in provider && typeof (provider as { removeListener?: (event: string, cb: (v: string[]) => void) => void }).removeListener === 'function') {
				(provider as { removeListener: (event: string, cb: (v: string[]) => void) => void }).removeListener('accountsChanged', handler)
			}
		}
	}
	return () => {}
}

export const addChainToWallet = async (provider: EIP1193Provider, chainId: number): Promise<void> => {
	const chainConfig = getChainConfig(chainId)
	if (!chainConfig) throw new Error(`Unknown chain ${chainId}`)
	await provider.request({
		method: 'wallet_addEthereumChain',
		params: [chainConfig],
	})
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

// EIP-6963: single listener for page lifetime; DApp MUST NOT remove it (spec). Key by rdns (stable across sessions).
const eip6963ByRdns = new Map<string, ProviderDetailType>()
let eip6963Listener: ((providers: ProviderDetailType[]) => void) | null = null
let eip6963Installed = false

const EIP6963_DEBUG = typeof import.meta.env !== 'undefined' && import.meta.env.DEV

function eip6963HandleAnnounce(e: Event) {
	const { detail } = e as CustomEvent<ProviderDetailType>
	if (EIP6963_DEBUG) {
		const hasRdns = !!detail?.info?.rdns
		const hasRequest = typeof detail?.provider?.request === 'function'
		console.debug('[EIP-6963] announce', {
			hasDetail: !!detail,
			hasRdns,
			rdns: detail?.info?.rdns,
			hasRequest,
			name: detail?.info?.name,
			accepted: hasRdns && hasRequest,
		})
	}
	if (detail?.info?.rdns && typeof detail.provider?.request === 'function') {
		eip6963ByRdns.set(detail.info.rdns, { info: detail.info, provider: detail.provider })
		const list = [...eip6963ByRdns.values()]
		if (EIP6963_DEBUG) console.debug('[EIP-6963] providers now', list.length, list.map((p) => p.info.name))
		eip6963Listener?.(list)
	}
}

export function subscribeProviders(listener: (providers: ProviderDetailType[]) => void): () => void {
	if (typeof window === 'undefined') return () => {}
	eip6963Listener = listener
	if (!eip6963Installed) {
		eip6963Installed = true
		window.addEventListener(PROVIDER_ANNOUNCE, eip6963HandleAnnounce)
		window.dispatchEvent(new Event(PROVIDER_REQUEST))
		if (EIP6963_DEBUG) console.debug('[EIP-6963] listener installed, request dispatched')
	}
	const list = [...eip6963ByRdns.values()]
	if (EIP6963_DEBUG) console.debug('[EIP-6963] subscribeProviders callback with', list.length, 'providers', list.map((p) => p.info.name))
	listener(list)
	return () => {
		eip6963Listener = null
	}
}

/** Re-dispatch eip6963:requestProvider (spec: DApp MAY re-initiate discovery). Call from console to debug. */
export function requestEIP6963Providers(): void {
	if (typeof window === 'undefined') return
	window.dispatchEvent(new Event(PROVIDER_REQUEST))
	if (EIP6963_DEBUG) console.debug('[EIP-6963] requestProvider dispatched')
}

if (typeof window !== 'undefined' && EIP6963_DEBUG) {
	(window as unknown as { requestEIP6963Providers?: () => void }).requestEIP6963Providers = requestEIP6963Providers
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

export const switchWalletChain = async (provider: EIP1193Provider, chainId: number): Promise<void> => {
	const chainIdHex = `0x${chainId.toString(16)}`
	try {
		await provider.request({
			method: 'wallet_switchEthereumChain',
			params: [{ chainId: chainIdHex }],
		})
	} catch (e) {
		const err = e as { code?: number }
		if (err.code === 4902) {
			await addChainToWallet(provider, chainId)
			await provider.request({
				method: 'wallet_switchEthereumChain',
				params: [{ chainId: chainIdHex }],
			})
		} else {
			throw e
		}
	}
}

export function createWalletState(): WalletState {
	return {
		providers: [],
		connectedDetail: null,
		address: null,
		chainId: null,
		isTestnet: false,
		isConnecting: false,
		error: null,
	}
}
