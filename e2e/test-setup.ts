/**
 * Shared E2E fixture: wallet mock, optional network mocks.
 * Import { test, expect } from '@playwright/test' and use addMockWallet(context)
 * (and addNetworkMocks(page) when needed) from this module.
 */

const MOCK_ADDRESS = '0x1234567890123456789012345678901234567890'

const mockWalletInitScript = () => {
	const MOCK = MOCK_ADDRESS
	const detail = {
		info: {
			uuid: 'mock-wallet-uuid',
			name: 'Mock Wallet',
			icon: '',
			rdns: 'com.mock',
		},
		provider: {
			request: (args: { method: string }) =>
				Promise.resolve(
					args.method === 'eth_requestAccounts'
						? [MOCK]
						: args.method === 'eth_chainId'
							? '0x1'
							: args.method === 'eth_accounts'
								? [MOCK]
								: null,
				),
		},
	}
	const announce = () => {
		window.dispatchEvent(
			new CustomEvent('eip6963:announceProvider', { detail }),
		)
	}
	window.addEventListener('eip6963:requestProvider', () => {
		announce()
	})
	for (const ms of [0, 50, 150, 300, 500, 800, 1200, 2000, 3000, 5000]) {
		setTimeout(announce, ms)
	}
}

const tevmWalletInitScript = (opts: {
	rpcUrl: string
	chainId: number
	address: string
	rdns: string
	name: string
}) => {
	Object.assign(window, {
		__E2E_TEVM__: true,
		__E2E_TEVM_RPC_URL__: opts.rpcUrl,
	})
	let activeChainId = opts.chainId
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
				emit('accountsChanged', [opts.address])
				return [opts.address]
			}
			if (args.method === 'wallet_switchEthereumChain') {
				const next = (
					(args.params?.[0] as { chainId?: string } | undefined)?.chainId ??
					`0x${activeChainId.toString(16)}`
				).toLowerCase()
				activeChainId = parseInt(next, 16)
				emit('chainChanged', `0x${activeChainId.toString(16)}`)
				return null
			}
			if (args.method === 'wallet_addEthereumChain') return null
			const response = await fetch(opts.rpcUrl, {
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
	const detail = {
		info: {
			uuid: 'tevm-e2e-wallet',
			name: opts.name,
			icon: '',
			rdns: opts.rdns,
		},
		provider,
	}
	Object.assign(window, {
		__E2E_TEVM_PROVIDER__: detail,
	})
	const announce = () => {
		window.dispatchEvent(
			new CustomEvent('eip6963:announceProvider', { detail }),
		)
	}
	window.addEventListener('eip6963:requestProvider', () => {
		announce()
	})
	for (const ms of [0, 50, 150, 300, 500, 800, 1200]) {
		setTimeout(announce, ms)
	}
}

/** Call after page.goto() to inject mock in page context (init script may not run in same world). */
export async function injectMockWalletInPage(
	page: import('@playwright/test').Page,
) {
	await page.evaluate((mockAddress: string) => {
		const detail = {
			info: {
				uuid: 'mock-wallet-uuid',
				name: 'Mock Wallet',
				icon: '',
				rdns: 'com.mock',
			},
			provider: {
				request: (args: { method: string }) =>
					Promise.resolve(
						args.method === 'eth_requestAccounts'
							? [mockAddress]
							: args.method === 'eth_chainId'
								? '0x1'
								: args.method === 'eth_accounts'
									? [mockAddress]
									: null,
					),
			},
		}
		const announce = () => {
			window.dispatchEvent(
				new CustomEvent('eip6963:announceProvider', { detail }),
			)
		}
		window.addEventListener('eip6963:requestProvider', () => {
			announce()
		})
		announce()
		setTimeout(announce, 50)
		setTimeout(announce, 200)
	}, MOCK_ADDRESS)
}

export async function addTevmWallet(
	context: {
		addInitScript: (
			fn: (...args: unknown[]) => void,
			...args: unknown[]
		) => Promise<void>
	},
	page:
		| {
				addInitScript: (
					fn: (...args: unknown[]) => void,
					...args: unknown[]
				) => Promise<void>
		  }
		| undefined,
	opts: {
		rpcUrl: string
		chainId: number
		address: `0x${string}`
		rdns: string
		name: string
	},
) {
	await context.addInitScript(tevmWalletInitScript, opts)
	if (page) {
		await page.addInitScript(tevmWalletInitScript, opts)
	}
}

export const ensureWalletConnected = async (
	page: import('@playwright/test').Page,
) => {
	const walletAddress = page.locator('[data-wallet-address]')
	if (await walletAddress.count()) {
		if (await walletAddress.first().isVisible()) return
	}
	const connectTrigger = page.locator('[data-wallet-connect-trigger]')
	if (await connectTrigger.count()) {
		await connectTrigger.click()
		const providerOption = page.locator('[data-wallet-provider-option]').first()
		await providerOption.waitFor({ state: 'visible', timeout: 15_000 })
		await providerOption.click()
	}
	await walletAddress.waitFor({ state: 'visible', timeout: 20_000 })
}

export const selectChainOption = async (
	page: import('@playwright/test').Page,
	label: string,
	optionName: string | RegExp,
) => {
	const trigger = page.getByLabel(label)
	await trigger.focus()
	await trigger.press('ArrowDown')
	const option = page.getByRole('option', { name: optionName }).first()
	await option.waitFor({ state: 'visible', timeout: 15_000 })
	await option.click()
	await page.keyboard.press('Escape')
}

export const selectProtocolOption = async (
	page: import('@playwright/test').Page,
	label: 'CCTP' | 'LI.FI',
) => {
	const option = page.getByRole('button', { name: label }).first()
	await option.waitFor({ state: 'visible', timeout: 15_000 })
	await option.click()
}

export async function addMockWallet(
	context: { addInitScript: (fn: () => void) => Promise<void> },
	page?: { addInitScript: (fn: () => void) => Promise<void> },
) {
	await context.addInitScript(mockWalletInitScript)
	if (page) await page.addInitScript(mockWalletInitScript)
}

const mockLifiRoutes = {
	routes: [
		{
			id: 'mock-route-1',
			fromChainId: 1,
			toChainId: 10,
			fromAmount: '1000000',
			toAmount: '999000',
			toAmountMin: '994005',
			gasCostUSD: '1.50',
			steps: [
				{
					tool: 'stargate',
					toolDetails: { name: 'Stargate' },
					type: 'CROSS_CHAIN',
					action: {
						fromChainId: 1,
						toChainId: 10,
						fromAmount: '1000000',
						toAmount: '999000',
					},
					estimate: { executionDuration: 120 },
				},
			],
			tags: ['BEST'],
		},
	],
}

export async function addLifiRoutesMock(
	page: import('@playwright/test').Page,
	body: unknown = mockLifiRoutes,
) {
	await page.route(
		(url: URL) =>
			url.href.includes('li.quest') || url.href.includes('api.li.fi'),
		(route) => {
			const req = route.request()
			const u = new URL(req.url())
			const isRoutes =
				req.method() === 'POST' && u.pathname.includes('/advanced/routes')
			route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify(isRoutes ? body : { chains: [] }),
			})
		},
	)
}

export async function addCctpMocks(page: import('@playwright/test').Page) {
	await page.route('**/v2/burn/USDC/fees/**', (route) => {
		route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify([
				{ finalityThreshold: 1000, minimumFee: 10 },
				{ finalityThreshold: 2000, minimumFee: 0 },
			]),
		})
	})
	await page.route('**/v2/fastBurn/USDC/allowance', (route) => {
		route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify({
				allowance: 1_000_000,
				lastUpdated: '2025-01-01T00:00:00Z',
			}),
		})
	})
}

export async function addNetworkMocks(
	page: import('@playwright/test').Page,
	opts: { lifi?: boolean; cctp?: boolean } = { lifi: true, cctp: false },
) {
	if (opts.lifi) await addLifiRoutesMock(page)
	if (opts.cctp) await addCctpMocks(page)
}
