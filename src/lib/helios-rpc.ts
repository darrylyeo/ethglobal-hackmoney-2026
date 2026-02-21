/**
 * Helios local RPC integration (spec 097). When "Use Helios (local)" is enabled
 * for a supported chain, effective RPC and provider use the local Helios URL;
 * on unreachable, fallback to default RPC and surface a notice.
 */

import { createHttpProvider, type VoltaireProvider } from '$/api/voltaire.ts'
import { rpcUrls } from '$/constants/rpc-endpoints.ts'
import { isHeliosSupportedChain } from '$/constants/helios-chains.ts'
import { HELIOS_LOCAL_DEFAULT_URL } from '$/constants/helios-config.ts'

let heliosLocalEnabled: Partial<Record<number, boolean>> = {}
let heliosLocalUrl = HELIOS_LOCAL_DEFAULT_URL
const fallbackUsed = new Set<number>()

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

export function setHeliosLocalUrl(url: string): void {
	heliosLocalUrl = url
}

export function getHeliosLocalEnabled(chainId: number): boolean {
	return Boolean(heliosLocalEnabled[chainId])
}

export function isHeliosFallbackUsed(chainId: number): boolean {
	return fallbackUsed.has(chainId)
}

function useHeliosForChain(chainId: number): boolean {
	return (
		isHeliosSupportedChain(chainId) &&
		Boolean(heliosLocalEnabled[chainId]) &&
		!fallbackUsed.has(chainId)
	)
}

/**
 * Effective RPC URL for a chain: Helios local URL when enabled and not fallen
 * back, otherwise default from rpc-endpoints.
 */
export function getEffectiveRpcUrl(chainId: number): string | undefined {
	return useHeliosForChain(chainId)
		? heliosLocalUrl
		: rpcUrls[chainId]
}

/**
 * Effective RPC URL map for all chains (for callers that need
 * Partial<Record<number, string>>).
 */
export function getEffectiveRpcUrls(): Partial<Record<number, string>> {
	const out: Partial<Record<number, string>> = { ...rpcUrls }
	for (const chainId of Object.keys(heliosLocalEnabled).map(Number)) {
		if (useHeliosForChain(chainId)) out[chainId] = heliosLocalUrl
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

/**
 * Returns a VoltaireProvider for the given chain. When Helios local is enabled
 * for that chain, uses Helios URL and falls back to default RPC on first
 * request failure, with a notice.
 */
export function createProviderForChain(chainId: number): VoltaireProvider {
	if (useHeliosForChain(chainId)) {
		return createFallbackWrapper(
			chainId,
			heliosLocalUrl,
			rpcUrls[chainId],
		)
	}
	const url = getEffectiveRpcUrl(chainId)
	if (!url) throw new Error(`No RPC URL for chain ${chainId}`)
	return createHttpProvider(url)
}
