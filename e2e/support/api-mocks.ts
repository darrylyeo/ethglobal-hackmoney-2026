/**
 * E2E API mocks: Gateway, LiFi, CCTP route/fulfill handlers and addNetworkMocks.
 */

export async function addGatewayMocks(page: import('@playwright/test').Page) {
	const gatewayBalanceHandler = (route: import('@playwright/test').Route) => {
		if (route.request().method() !== 'POST') return route.continue()
		route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify({
				token: 'USDC',
				balances: [
					{
						domain: 26,
						depositor: '0x0000000000000000000000000000000000000000',
						balance: '0',
					},
				],
			}),
		})
	}
	await page.route(
		'**/gateway-api-testnet.circle.com/v1/balances',
		gatewayBalanceHandler,
	)
	await page.route(
		'**/gateway-api.circle.com/v1/balances',
		gatewayBalanceHandler,
	)
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

const mockLifiQuoteStep = {
	action: {
		fromChainId: 1,
		toChainId: 10,
		fromAmount: '1000000',
		toAmount: '999000',
	},
	estimate: {
		gasCosts: [{ amount: '150000', token: { symbol: 'ETH', chainId: 1 } }],
	},
	tool: 'stargate',
	includedSteps: [],
	transactionRequest: {
		to: '0x0000000000000000000000000000000000000001',
		data: '0xdeadbeef',
		value: '0',
		gasLimit: '200000',
	},
}

const lifiRoutesHandler = (body: unknown, opts?: { quoteFails?: boolean }) =>
	(route: import('@playwright/test').Route) => {
		const req = route.request()
		if (req.method() === 'OPTIONS') {
			route.fulfill({
				status: 204,
				headers: {
					'Access-Control-Allow-Origin': '*',
					'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
					'Access-Control-Allow-Headers': 'Content-Type',
				},
			})
			return
		}
		const u = new URL(req.url())
		const isQuote = req.method() === 'GET' && u.pathname.includes('/quote')
		const isStepTransaction =
			req.method() === 'POST' &&
			u.pathname.includes('/advanced/stepTransaction')
		const isRoutes =
			req.method() === 'POST' &&
			(u.pathname.includes('/advanced/routes') ||
				u.pathname.includes('/routes'))

		if (opts?.quoteFails && (isQuote || isStepTransaction)) {
			route.fulfill({
				status: 500,
				contentType: 'application/json',
				body: JSON.stringify({ error: 'Simulated quote failure' }),
			})
			return
		}

		let responseBody: unknown
		if (isQuote || isStepTransaction) {
			responseBody = mockLifiQuoteStep
		} else if (isRoutes) {
			responseBody = body
		} else {
			responseBody = { chains: [] }
		}
		route.fulfill({
			status: 200,
			headers: { 'Access-Control-Allow-Origin': '*' },
			contentType: 'application/json',
			body: JSON.stringify(responseBody),
		})
	}

const LIFI_ROUTE_GLOB = /li\.quest|api\.li\.fi|li-fi/

export async function addLifiRoutesMock(
	page: import('@playwright/test').Page,
	body: unknown = mockLifiRoutes,
	opts?: { quoteFails?: boolean },
) {
	await page.route(LIFI_ROUTE_GLOB, lifiRoutesHandler(body, opts))
}

export async function addLifiRoutesMockToContext(
	context: import('@playwright/test').BrowserContext,
	body: unknown = mockLifiRoutes,
	opts?: { quoteFails?: boolean },
) {
	await context.route(LIFI_ROUTE_GLOB, lifiRoutesHandler(body, opts))
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
