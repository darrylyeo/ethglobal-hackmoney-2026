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
	await page.route('**/api.li.fi/**', (route) => {
		if (route.request().method() === 'POST') {
			route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify(body),
			})
		} else {
			route.continue()
		}
	})
	await page.route('**/li.quest/**', (route) => {
		route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify(body),
		})
	})
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
