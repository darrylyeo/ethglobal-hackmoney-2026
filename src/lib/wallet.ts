import { createWalletClient, custom } from 'viem'
import type { Chain, WalletClient } from 'viem'
import type { Network } from '$/constants/networks.ts'
import {
	networkConfigsByChainId,
	networksByChainId,
} from '$/constants/networks.ts'
import { rpcUrls } from '$/constants/rpc-endpoints.ts'
import { E2E_TEVM_RPC_URL } from '$/tests/tevm.ts'
import {
	E2E_TEVM_CHAIN_ID,
	E2E_TEVM_PROVIDER_NAME,
	E2E_TEVM_PROVIDER_RDNS,
	E2E_TEVM_WALLET_ADDRESS,
} from '$/tests/tevmConfig.ts'

export type EIP1193Provider = {
	request(args: { method: string; params?: unknown[] }): Promise<unknown>
}

export type ProviderDetailType = {
	info: Readonly<{ uuid: string; name: string; icon: string; rdns: string }>
	provider: EIP1193Provider
}

declare global {
	interface Window {
		__E2E_TEVM_PROVIDER__?: ProviderDetailType
	}
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

export const getWalletChainId = async (
	provider: EIP1193Provider,
): Promise<number> => {
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
	if (
		'on' in provider &&
		typeof (
			provider as { on?: (event: string, cb: (v: string) => void) => void }
		).on === 'function'
	) {
		;(provider as { on: (event: string, cb: (v: string) => void) => void }).on(
			'chainChanged',
			handler,
		)
		return () => {
			if (
				'removeListener' in provider &&
				typeof (
					provider as {
						removeListener?: (event: string, cb: (v: string) => void) => void
					}
				).removeListener === 'function'
			) {
				;(
					provider as {
						removeListener: (event: string, cb: (v: string) => void) => void
					}
				).removeListener('chainChanged', handler)
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
	if (
		'on' in provider &&
		typeof (
			provider as { on?: (event: string, cb: (v: string[]) => void) => void }
		).on === 'function'
	) {
		;(
			provider as { on: (event: string, cb: (v: string[]) => void) => void }
		).on('accountsChanged', handler)
		return () => {
			if (
				'removeListener' in provider &&
				typeof (
					provider as {
						removeListener?: (event: string, cb: (v: string[]) => void) => void
					}
				).removeListener === 'function'
			) {
				;(
					provider as {
						removeListener: (event: string, cb: (v: string[]) => void) => void
					}
				).removeListener('accountsChanged', handler)
			}
		}
	}
	return () => {}
}

export const addChainToWallet = async (
	provider: EIP1193Provider,
	chainId: number,
): Promise<void> => {
	const config = networkConfigsByChainId[chainId]
	const rpcUrl = rpcUrls[chainId]
	if (!config || !rpcUrl) throw new Error(`Unknown chain ${chainId}`)
	await provider.request({
		method: 'wallet_addEthereumChain',
		params: [
			{
				chainId: `0x${chainId.toString(16)}`,
				chainName: config.name,
				nativeCurrency: {
					name: config.nativeCurrency.name,
					symbol: config.nativeCurrency.symbol,
					decimals: 18,
				},
				rpcUrls: [rpcUrl],
				blockExplorerUrls: config.explorerUrl
					? [config.explorerUrl]
					: undefined,
			},
		],
	})
}

const PROVIDER_ANNOUNCE = 'eip6963:announceProvider'
const PROVIDER_REQUEST = 'eip6963:requestProvider'

const MINIMAL_CHAINS = new Map(
	(
		Object.entries(networksByChainId) as unknown as [string, Network | undefined][]
	).filter((entry): entry is [string, Network] => entry[1] != null).map(([idStr, n]) => [
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
	return (
		c ??
		({
			id: chainId,
			name: `Chain ${chainId}`,
			nativeCurrency: { decimals: 18, name: 'Ether', symbol: 'ETH' },
			rpcUrls: { default: { http: [] } },
		} as Chain)
	)
}

// EIP-6963: single listener for page lifetime; DApp MUST NOT remove it (spec). Key by rdns (stable across sessions).
const eip6963ByRdns = new Map<string, ProviderDetailType>()
let eip6963Listener: ((providers: ProviderDetailType[]) => void) | null = null
let eip6963Installed = false

const EIP6963_DEBUG =
	typeof import.meta.env !== 'undefined' && import.meta.env.DEV

export const ensureE2eProvider = () => {
	if (typeof window === 'undefined') return
	const existing = window.__E2E_TEVM_PROVIDER__
	if (existing?.provider && existing.info) {
		const nextInfo = {
			uuid: existing.info.uuid ?? 'tevm-e2e-wallet',
			name: existing.info.name ?? E2E_TEVM_PROVIDER_NAME,
			icon: existing.info.icon ?? '',
			rdns: existing.info.rdns ?? E2E_TEVM_PROVIDER_RDNS,
		}
		if (
			existing.info.uuid !== nextInfo.uuid ||
			existing.info.name !== nextInfo.name ||
			existing.info.icon !== nextInfo.icon ||
			existing.info.rdns !== nextInfo.rdns
		) {
			window.__E2E_TEVM_PROVIDER__ = {
				info: nextInfo,
				provider: existing.provider,
			}
		}
		return
	}
	if (!E2E_TEVM_RPC_URL) return
	let activeChainId = E2E_TEVM_CHAIN_ID
	const listeners = new Map<string, Array<(payload: unknown) => void>>()
	const emit = (event: string, payload: unknown) => {
		const handlers = listeners.get(event) ?? []
		for (const handler of handlers) handler(payload)
	}
	const provider = {
		request: async (args: { method: string; params?: unknown[] }) => {
			if (args.method === 'eth_chainId') {
				return `0x${activeChainId.toString(16)}`
			}
			if (
				args.method === 'eth_requestAccounts' ||
				args.method === 'eth_accounts'
			) {
				emit('accountsChanged', [E2E_TEVM_WALLET_ADDRESS])
				return [E2E_TEVM_WALLET_ADDRESS]
			}
			if (args.method === 'wallet_switchEthereumChain') {
				const [first] = args.params ?? []
				const nextHex =
					typeof first === 'object' && first !== null
						? Reflect.get(first, 'chainId')
						: null
				const parsed =
					typeof nextHex === 'string'
						? Number.parseInt(nextHex, 16)
						: activeChainId
				activeChainId = Number.isNaN(parsed) ? activeChainId : parsed
				emit('chainChanged', `0x${activeChainId.toString(16)}`)
				return null
			}
			if (args.method === 'wallet_addEthereumChain') return null
			const response = await fetch(E2E_TEVM_RPC_URL, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					jsonrpc: '2.0',
					id: Date.now(),
					method: args.method,
					params: args.params ?? [],
				}),
			})
			const payload = await response.json()
			if (payload.error) throw new Error(payload.error.message ?? 'RPC error')
			return payload.result
		},
		on: (event: string, handler: (payload: unknown) => void) => {
			const existing = listeners.get(event) ?? []
			listeners.set(event, [...existing, handler])
			return provider
		},
		removeListener: (event: string, handler: (payload: unknown) => void) => {
			const existing = listeners.get(event) ?? []
			listeners.set(
				event,
				existing.filter((entry) => entry !== handler),
			)
			return provider
		},
	}
	window.__E2E_TEVM_PROVIDER__ = {
		info: {
			uuid: 'tevm-e2e-wallet',
			name: E2E_TEVM_PROVIDER_NAME,
			icon: '',
			rdns: E2E_TEVM_PROVIDER_RDNS,
		},
		provider,
	}
}

export const getE2eProvider = () =>
	typeof window !== 'undefined'
		? (window.__E2E_TEVM_PROVIDER__?.provider ?? null)
		: null

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
		eip6963ByRdns.set(detail.info.rdns, {
			info: detail.info,
			provider: detail.provider,
		})
		const list = [...eip6963ByRdns.values()]
		if (EIP6963_DEBUG)
			console.debug(
				'[EIP-6963] providers now',
				list.length,
				list.map((p) => p.info.name),
			)
		eip6963Listener?.(list)
	}
}

export function subscribeProviders(
	listener: (providers: ProviderDetailType[]) => void,
): () => void {
	if (typeof window === 'undefined') return () => {}
	ensureE2eProvider()
	const e2eProvider = window.__E2E_TEVM_PROVIDER__
	if (
		e2eProvider?.info?.rdns &&
		typeof e2eProvider.provider?.request === 'function'
	) {
		eip6963ByRdns.set(e2eProvider.info.rdns, e2eProvider)
	}
	eip6963Listener = listener
	if (!eip6963Installed) {
		eip6963Installed = true
		window.addEventListener(PROVIDER_ANNOUNCE, eip6963HandleAnnounce)
		window.dispatchEvent(new Event(PROVIDER_REQUEST))
		if (EIP6963_DEBUG)
			console.debug('[EIP-6963] listener installed, request dispatched')
	}
	const list = [...eip6963ByRdns.values()]
	if (EIP6963_DEBUG)
		console.debug(
			'[EIP-6963] subscribeProviders callback with',
			list.length,
			'providers',
			list.map((p) => p.info.name),
		)
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
	;(
		window as unknown as { requestEIP6963Providers?: () => void }
	).requestEIP6963Providers = requestEIP6963Providers
}

export async function connectProvider(
	detail: ProviderDetailType,
): Promise<`0x${string}`> {
	const accounts = (await detail.provider.request({
		method: 'eth_requestAccounts',
		params: [],
	})) as string[]
	const addr = accounts[0]
	if (!addr || !addr.startsWith('0x')) throw new Error('No account returned')
	return addr as `0x${string}`
}

export function createWalletClientForChain(
	provider: EIP1193Provider,
	chainId: number,
): WalletClient {
	return createWalletClient({
		chain: chainFor(chainId),
		transport: custom(provider),
	})
}

export const switchWalletChain = async (
	provider: EIP1193Provider,
	chainId: number,
): Promise<void> => {
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
