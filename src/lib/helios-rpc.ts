/**
 * Helios RPC integration (spec 097). Local mode: app uses local Helios process URL.
 * Browser mode: app uses @a16z/helios WASM provider (createHeliosProvider +
 * waitSynced). Fallback to default RPC and notice on unreachable.
 */

import { createHttpProvider, type VoltaireProvider } from '$/api/voltaire.ts'
import { rpcUrls } from '$/constants/rpc-endpoints.ts'
import {
	HELIOS_CHAINS,
	type HeliosNetworkKind,
} from '$/constants/helios-chains.ts'
import {
	heliosBeaconNetworkFor,
	heliosConsensusUrlForBrowser,
	heliosLocalEndpoints,
} from '$/constants/helios-config.ts'

let heliosLocalEnabled: Partial<Record<number, boolean>> = {}
let heliosBrowserEnabled: Partial<Record<number, boolean>> = {}
let heliosLocalUrl = heliosLocalEndpoints[0].url
const fallbackUsed = new Set<number>()

export enum HeliosBrowserSyncStatus {
	Idle = 'idle',
	Syncing = 'syncing',
	Ready = 'ready',
	Fallback = 'fallback',
}
const browserSyncStatus: Partial<Record<number, HeliosBrowserSyncStatus>> = {}
let onBrowserSyncStatusChange: ((chainId: number) => void) | null = null
export function setHeliosBrowserSyncStatusHandler(
	handler: ((chainId: number) => void) | null,
): void {
	onBrowserSyncStatusChange = handler
}

/** Set from app (e.g. layout) to show a notice when Helios falls back. */
let onHeliosFallback: ((chainId: number) => void) | null = null
export function setHeliosFallbackNoticeHandler(
	handler: ((chainId: number) => void) | null,
): void {
	onHeliosFallback = handler
}

export function setHeliosLocalEnabled(chainId: number, enabled: boolean): void {
	heliosLocalEnabled = { ...heliosLocalEnabled, [chainId]: enabled }
	if (!enabled) fallbackUsed.delete(chainId)
}

export function setHeliosBrowserEnabled(
	chainId: number,
	enabled: boolean,
): void {
	heliosBrowserEnabled = { ...heliosBrowserEnabled, [chainId]: enabled }
	if (!enabled) {
		fallbackUsed.delete(chainId)
		browserSyncStatus[chainId] = HeliosBrowserSyncStatus.Idle
		browserProviderCache.delete(chainId)
		onBrowserSyncStatusChange?.(chainId)
	}
}

export function setHeliosLocalUrl(url: string): void {
	heliosLocalUrl = url
}

export function getHeliosLocalEnabled(chainId: number): boolean {
	return Boolean(heliosLocalEnabled[chainId])
}

export function getHeliosBrowserEnabled(chainId: number): boolean {
	return Boolean(heliosBrowserEnabled[chainId])
}

export function getHeliosBrowserSyncStatus(
	chainId: number,
): HeliosBrowserSyncStatus {
	return browserSyncStatus[chainId] ?? HeliosBrowserSyncStatus.Idle
}

export function isHeliosFallbackUsed(chainId: number): boolean {
	return fallbackUsed.has(chainId)
}

function useHeliosLocalForChain(chainId: number): boolean {
	return (
		chainId in HELIOS_CHAINS &&
		Boolean(heliosLocalEnabled[chainId]) &&
		!fallbackUsed.has(chainId)
	)
}

function useHeliosBrowserForChain(chainId: number): boolean {
	return (
		chainId in HELIOS_CHAINS &&
		Boolean(heliosBrowserEnabled[chainId]) &&
		!fallbackUsed.has(chainId)
	)
}

/**
 * Effective RPC URL for a chain: Helios local URL when local enabled and not
 * fallen back; for browser mode we use default RPC (Tevm fork still uses HTTP).
 */
export function getEffectiveRpcUrl(chainId: number): string | undefined {
	if (useHeliosLocalForChain(chainId)) return heliosLocalUrl
	return rpcUrls[chainId]
}

/**
 * Effective RPC URL map for all chains (for callers that need
 * Partial<Record<number, string>>).
 */
export function getEffectiveRpcUrls(): Partial<Record<number, string>> {
	const out: Partial<Record<number, string>> = { ...rpcUrls }
	for (const chainId of Object.keys(heliosLocalEnabled).map(Number)) {
		if (useHeliosLocalForChain(chainId)) out[chainId] = heliosLocalUrl
	}
	return out
}

function createFallbackWrapper(
	chainId: number,
	heliosUrl: string,
	defaultUrl: string | undefined,
): VoltaireProvider {
	const heliosProvider = createHttpProvider(heliosUrl)
	let defaultProvider: VoltaireProvider | null = null

	const provider: VoltaireProvider = {
		request: async (args) => {
			try {
				return await heliosProvider.request(args)
			} catch {
				if (!defaultProvider && defaultUrl) {
					fallbackUsed.add(chainId)
					defaultProvider = createHttpProvider(defaultUrl)
					onHeliosFallback?.(chainId)
				}
				if (defaultProvider) return defaultProvider.request(args)
				throw new Error(`No RPC URL for chain ${chainId}`)
			}
		},
		on: () => provider,
		removeListener: () => provider,
	}
	return provider
}

const browserProviderCache = new Map<
	number,
	{ provider: VoltaireProvider; configHash: string }
>()

function browserConfigHash(chainId: number): string {
	const url = rpcUrls[chainId]
	const info = HELIOS_CHAINS[chainId as keyof typeof HELIOS_CHAINS]
	const beacon = info ? heliosBeaconNetworkFor(info.network) : null
	return `${chainId}:${url ?? ''}:${info?.network ?? ''}:${info?.kind ?? ''}:${beacon ? heliosConsensusUrlForBrowser(beacon) : ''}`
}

async function getOrCreateHeliosBrowserProvider(
	chainId: number,
): Promise<VoltaireProvider> {
	const cached = browserProviderCache.get(chainId)
	const hash = browserConfigHash(chainId)
	if (cached?.configHash === hash) return cached.provider

	const defaultUrl = rpcUrls[chainId]
	const info = HELIOS_CHAINS[chainId as keyof typeof HELIOS_CHAINS]
	if (!defaultUrl || !info) throw new Error(`No RPC or Helios config for chain ${chainId}`)

	browserSyncStatus[chainId] = HeliosBrowserSyncStatus.Syncing
	onBrowserSyncStatusChange?.(chainId)

	try {
		const { createHeliosProvider } = await import('@a16z/helios')
		type HeliosConfig = Parameters<typeof createHeliosProvider>[0]
		const consensusRpc =
			heliosConsensusUrlForBrowser(heliosBeaconNetworkFor(info.network))
		const heliosProvider = await createHeliosProvider(
			{
				executionRpc: defaultUrl,
				consensusRpc: consensusRpc || undefined,
				network: info.network as HeliosConfig['network'],
				dbType: 'localstorage',
			},
			info.kind,
		)
		await heliosProvider.waitSynced()
		const provider: VoltaireProvider = {
			request: async (args) => {
				try {
					return await heliosProvider.request({
						method: args.method,
						params: args.params ?? [],
					})
				} catch {
					fallbackUsed.add(chainId)
					browserSyncStatus[chainId] = HeliosBrowserSyncStatus.Fallback
					browserProviderCache.delete(chainId)
					onHeliosFallback?.(chainId)
					onBrowserSyncStatusChange?.(chainId)
					if (defaultUrl)
						return createHttpProvider(defaultUrl).request(args)
					throw new Error(`No RPC URL for chain ${chainId}`)
				}
			},
			on: (event, listener) => {
				heliosProvider.on(event, listener)
				return provider
			},
			removeListener: (event, listener) => {
				heliosProvider.removeListener(event, listener)
				return provider
			},
		}
		browserSyncStatus[chainId] = HeliosBrowserSyncStatus.Ready
		onBrowserSyncStatusChange?.(chainId)
		browserProviderCache.set(chainId, { provider, configHash: hash })
		return provider
	} catch {
		fallbackUsed.add(chainId)
		browserSyncStatus[chainId] = HeliosBrowserSyncStatus.Fallback
		browserProviderCache.delete(chainId)
		onHeliosFallback?.(chainId)
		onBrowserSyncStatusChange?.(chainId)
		if (defaultUrl) return createHttpProvider(defaultUrl)
		throw new Error(`No RPC URL for chain ${chainId}`)
	}
}

/**
 * Returns a VoltaireProvider for the given chain. When Helios local is enabled,
 * uses local URL with fallback. When Helios browser is enabled, returns a
 * wrapper that resolves the WASM provider on first request (sync state
 * visible via getHeliosBrowserSyncStatus).
 */
export function createProviderForChain(chainId: number): VoltaireProvider {
	if (useHeliosLocalForChain(chainId)) {
		return createFallbackWrapper(
			chainId,
			heliosLocalUrl,
			rpcUrls[chainId],
		)
	}
	if (useHeliosBrowserForChain(chainId)) {
		let promise: Promise<VoltaireProvider> | null = null
		const getProvider = () =>
			promise ?? (promise = getOrCreateHeliosBrowserProvider(chainId))
		const provider: VoltaireProvider = {
			request: async (args) => (await getProvider()).request(args),
			on: () => provider,
			removeListener: () => provider,
		}
		return provider
	}
	const url = getEffectiveRpcUrl(chainId)
	if (!url) throw new Error(`No RPC URL for chain ${chainId}`)
	return createHttpProvider(url)
}
