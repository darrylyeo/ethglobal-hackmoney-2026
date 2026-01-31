import { describe, expect, it } from 'vitest'
import { ChainId } from '$/constants/networks'
import { getChainConfig } from './chain-configs'

describe('getChainConfig', () => {
	it('returns valid config for supported chains', () => {
		const config = getChainConfig(ChainId.Ethereum)
		expect(config).not.toBeNull()
		expect(config?.chainId).toBe('0x1')
		expect(config?.chainName).toBe('Ethereum')
		expect(config?.rpcUrls).toHaveLength(1)
		expect(config?.rpcUrls[0]).toMatch(/^https:/)
		expect(config?.nativeCurrency.decimals).toBe(18)
	})

	it('includes correct native currency per chain', () => {
		expect(getChainConfig(ChainId.Ethereum)?.nativeCurrency.symbol).toBe('ETH')
		expect(getChainConfig(ChainId.Polygon)?.nativeCurrency.symbol).toBe('MATIC')
		expect(getChainConfig(ChainId.Celo)?.nativeCurrency.symbol).toBe('CELO')
		expect(getChainConfig(ChainId.Avalanche)?.nativeCurrency.symbol).toBe('AVAX')
	})

	it('includes RPC URL and explorer URL when available', () => {
		const config = getChainConfig(ChainId.Base)
		expect(config?.rpcUrls).toHaveLength(1)
		expect(config?.rpcUrls[0]).toBeTruthy()
		expect(config?.blockExplorerUrls).toBeDefined()
		expect(config?.blockExplorerUrls?.[0]).toContain('basescan')
	})

	it('returns null for unknown chain', () => {
		expect(getChainConfig(99999)).toBeNull()
	})
})
