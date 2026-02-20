import { describe, expect, it, vi } from 'vitest'
import type { EIP1193Provider } from './wallet.ts'
import {
	createWalletState,
	getWalletChainId,
	subscribeChainChanged,
	switchWalletChain,
	addChainToWallet,
} from './wallet.ts'

describe('getWalletChainId', () => {
	it('returns current chain as number', async () => {
		const provider: EIP1193Provider = {
			request: vi.fn(() => Promise.resolve('0x1')),
		}
		const chainId = await getWalletChainId(provider)
		expect(chainId).toBe(1)
	})

	it('parses hex chainId', async () => {
		const provider: EIP1193Provider = {
			request: vi.fn(() => Promise.resolve('0xa')),
		}
		const chainId = await getWalletChainId(provider)
		expect(chainId).toBe(10)
	})
})

describe('subscribeChainChanged', () => {
	it('returns unsubscribe function', () => {
		const provider = { request: vi.fn() }
		const unsub = subscribeChainChanged(provider as EIP1193Provider, () => {})
		expect(typeof unsub).toBe('function')
		unsub()
	})

	it('fires callback on chain change when provider has on', () => {
		const callback = vi.fn()
		const handler = vi.fn()
		const removeListener = vi.fn()
		const provider = {
			request: vi.fn(),
			on: vi.fn((_event: string, h: (v: string) => void) => {
				handler.mockImplementation(h)
				return undefined
			}),
			removeListener,
		}
		const unsub = subscribeChainChanged(
			provider as unknown as EIP1193Provider,
			callback,
		)
		expect(provider.on).toHaveBeenCalledWith(
			'chainChanged',
			expect.any(Function),
		)
		handler('0x2')
		expect(callback).toHaveBeenCalledWith(2)
		unsub()
		expect(removeListener).toHaveBeenCalled()
	})
})

describe('switchWalletChain', () => {
	it('requests chain switch', async () => {
		const request = vi.fn(() => Promise.resolve(undefined))
		const provider: EIP1193Provider = { request }
		await switchWalletChain(provider, 42161)
		expect(request).toHaveBeenCalledWith({
			method: 'wallet_switchEthereumChain',
			params: [{ chainId: '0xa4b1' }],
		})
	})

	it('adds chain and retries on 4902', async () => {
		const request = vi.fn()
		request
			.mockRejectedValueOnce({ code: 4902 })
			.mockResolvedValueOnce(undefined)
			.mockResolvedValueOnce(undefined)
		const provider: EIP1193Provider = { request }
		await switchWalletChain(provider, 8453)
		expect(request).toHaveBeenCalledTimes(3)
		expect(request).toHaveBeenNthCalledWith(1, {
			method: 'wallet_switchEthereumChain',
			params: [{ chainId: '0x2105' }],
		})
		expect(request).toHaveBeenNthCalledWith(2, {
			method: 'wallet_addEthereumChain',
			params: [
				expect.objectContaining({ chainId: '0x2105', chainName: 'Base' }),
			],
		})
		expect(request).toHaveBeenNthCalledWith(3, {
			method: 'wallet_switchEthereumChain',
			params: [{ chainId: '0x2105' }],
		})
	})

	it('throws on non-4902 error', async () => {
		const provider: EIP1193Provider = {
			request: vi.fn(() => Promise.reject(new Error('User rejected'))),
		}
		await expect(switchWalletChain(provider, 1)).rejects.toThrow(
			'User rejected',
		)
	})
})

describe('addChainToWallet', () => {
	it('adds chain with network from networks', async () => {
		const request = vi.fn(() => Promise.resolve(undefined))
		const provider: EIP1193Provider = { request }
		await addChainToWallet(provider, 8453)
		expect(request).toHaveBeenCalledWith({
			method: 'wallet_addEthereumChain',
			params: [
				expect.objectContaining({
					chainId: '0x2105',
					chainName: 'Base',
					rpcUrls: [expect.any(String)],
					nativeCurrency: expect.objectContaining({ decimals: 18 }),
				}),
			],
		})
	})

	it('throws for unknown chain', async () => {
		const provider: EIP1193Provider = { request: vi.fn() }
		await expect(addChainToWallet(provider, 99999)).rejects.toThrow(
			'Unknown chain',
		)
	})
})

describe('createWalletState', () => {
	it('includes chainId null', () => {
		const state = createWalletState()
		expect(state.chainId).toBeNull()
		expect(state.address).toBeNull()
		expect(state.connectedDetail).toBeNull()
	})
})
