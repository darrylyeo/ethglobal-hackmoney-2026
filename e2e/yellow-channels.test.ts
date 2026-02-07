/**
 * E2E: Yellow state channel lifecycle.
 * Tests: connect → create channel → send transfer → close channel.
 */

import { test, expect } from './fixtures/mock-clearnode.ts'
import { ensureWalletConnected } from './test-setup.ts'
import {
	E2E_TEVM_WALLET_ADDRESS,
	E2E_TEVM_PROVIDER_NAME,
	E2E_TEVM_PROVIDER_RDNS,
} from '../src/tests/tevmConfig.ts'

const addYellowWallet = async (
	context: {
		addInitScript: (fn: (...args: unknown[]) => void, ...args: unknown[]) => Promise<void>
	},
	page: {
		addInitScript: (fn: (...args: unknown[]) => void, ...args: unknown[]) => Promise<void>
	} | undefined,
	opts: {
		address: string
		rdns: string
		name: string
		clearnodeWsUrl: string
	},
) => {
	const initScript = (o: typeof opts) => {
		Object.assign(window, {
			__E2E_TEVM__: true,
			__E2E_CLEARNODE_WS_URL__: o.clearnodeWsUrl,
		})
		const mockSig = '0x' + 'ab'.repeat(32) + 'cd'.repeat(32) + '1b'
		let activeChainId = 1
		const listeners = new Map<string, Array<(payload: unknown) => void>>()
		const emit = (event: string, payload: unknown) => {
			for (const handler of listeners.get(event) ?? []) handler(payload)
		}
		const provider = {
			request: async (args: { method: string; params?: unknown[] }) => {
				if (args.method === 'eth_chainId')
					return `0x${activeChainId.toString(16)}`
				if (args.method === 'eth_requestAccounts' || args.method === 'eth_accounts') {
					emit('accountsChanged', [o.address])
					return [o.address]
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
				if (args.method === 'eth_signTypedData_v4' || args.method === 'eth_signTypedData') return mockSig
				if (args.method === 'personal_sign') return mockSig
				return null
			},
			on: (event: string, handler: (payload: unknown) => void) => {
				listeners.set(event, [...(listeners.get(event) ?? []), handler])
				return provider
			},
			removeListener: (event: string, handler: (payload: unknown) => void) => {
				listeners.set(event, (listeners.get(event) ?? []).filter((h) => h !== handler))
				return provider
			},
		}
		const detail = {
			info: { uuid: 'yellow-e2e-wallet', name: o.name, icon: '', rdns: o.rdns },
			provider,
		}
		Object.assign(window, { __E2E_TEVM_PROVIDER__: detail, __E2E_PROVIDER__: provider })
		const announce = () => {
			window.dispatchEvent(new CustomEvent('eip6963:announceProvider', { detail }))
		}
		window.addEventListener('eip6963:requestProvider', () => announce())
		for (const ms of [0, 50, 150, 300, 500, 800, 1200]) {
			setTimeout(announce, ms)
		}
	}
	await context.addInitScript(initScript, opts)
	if (page) await page.addInitScript(initScript, opts)
}

/** Call connectToYellow via the page's exposed window globals. */
const connectYellowViaEval = async (page: import('@playwright/test').Page, address: string) => {
	await page.waitForFunction(() => (window as any).__yellowConnectToYellow__, { timeout: 10_000 })
	const result = await page.evaluate(async (addr) => {
		try {
			const provider = (window as any).__E2E_PROVIDER__
			if (!provider) return { error: 'No provider found' }
			const wsUrl = (window as any).__E2E_CLEARNODE_WS_URL__
			if (!wsUrl) return { error: 'No clearnode WS URL' }
			await (window as any).__yellowConnectToYellow__(1, provider, addr, wsUrl)
			return { ok: true }
		} catch (err: any) {
			return { error: err?.message ?? String(err) }
		}
	}, address)
	if (result && 'error' in result) {
		throw new Error(`connectToYellow failed: ${result.error}`)
	}
}

/** Call openChannel via the page's exposed window globals. */
const createChannelViaEval = async (page: import('@playwright/test').Page) => {
	await page.evaluate(async () => {
		const state = (window as any).__yellowState__
		const token = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' // USDC mainnet
		await (window as any).__yellowOpenChannel__({
			clearnodeConnection: state.clearnodeConnection,
			chainId: state.chainId,
			token,
		})
	})
}

/** Call sendTransfer via the page's exposed window globals. */
const sendTransferViaEval = async (page: import('@playwright/test').Page, destination: string, amount: string) => {
	await page.evaluate(async ([dest, amt]) => {
		const state = (window as any).__yellowState__
		await (window as any).__yellowSendTransfer__({
			clearnodeConnection: state.clearnodeConnection,
			destination: dest,
			allocations: [{ asset: 'usdc', amount: amt }],
		})
	}, [destination, amount] as const)
}

/** Call closeChannel via the page's exposed window globals. */
const closeChannelViaEval = async (page: import('@playwright/test').Page, channelId: string) => {
	await page.evaluate(async (chId) => {
		const state = (window as any).__yellowState__
		await (window as any).__yellowCloseChannel__({
			clearnodeConnection: state.clearnodeConnection,
			channelId: chId,
			fundsDestination: state.address,
		})
	}, channelId)
}

test.describe('Yellow state channel lifecycle (Spec 032)', () => {
	test('full lifecycle: connect → create channel → transfer → close', async ({
		context,
		page,
		mockClearnode,
	}) => {
		mockClearnode.setBalance(E2E_TEVM_WALLET_ADDRESS.toLowerCase(), 'usdc', '100.0')

		await addYellowWallet(context, page, {
			address: E2E_TEVM_WALLET_ADDRESS,
			rdns: E2E_TEVM_PROVIDER_RDNS,
			name: E2E_TEVM_PROVIDER_NAME,
			clearnodeWsUrl: mockClearnode.wsUrl,
		})

		// Navigate to channels page
		await page.goto('/positions/channels')
		await expect(
			page.getByRole('heading', { name: 'Channels', level: 1 }),
		).toBeVisible({ timeout: 60_000 })

		// Verify disconnected state
		await expect(page.locator('[data-yellow-status="disconnected"]')).toBeVisible({
			timeout: 10_000,
		})

		// Step 1: Connect to Yellow clearnode via evaluate
		await connectYellowViaEval(page, E2E_TEVM_WALLET_ADDRESS)

		// Verify connected status updates in UI
		await expect(page.locator('[data-yellow-status="connected"]')).toBeVisible({
			timeout: 15_000,
		})

		// Step 2: Create a channel
		await createChannelViaEval(page)

		// Wait for channel to appear in the table
		await expect(page.locator('tbody tr').first()).toBeVisible({
			timeout: 15_000,
		})

		// Verify channel shows "active" status
		await expect(page.locator('tbody tr').first().locator('[data-status]')).toHaveText(
			'active',
			{ timeout: 10_000 },
		)

		// Step 3: Send a transfer (to clearnode address)
		await sendTransferViaEval(page, mockClearnode.clearnodeAddress, '5.0')

		// Verify mock clearnode recorded the transfer
		expect(mockClearnode.state.transfers.length).toBeGreaterThan(0)

		// Step 4: Close the channel
		const channelId = [...mockClearnode.state.channels.keys()][0]
		expect(channelId).toBeTruthy()
		await closeChannelViaEval(page, channelId!)

		// Channel should update to "closed" status in UI
		await expect(
			page.locator('tbody tr').first().locator('[data-status]'),
		).toHaveText('closed', { timeout: 15_000 })

		// Verify mock clearnode state
		const closedChannel = [...mockClearnode.state.channels.values()].find(
			(ch) => ch.status === 'closed',
		)
		expect(closedChannel).toBeTruthy()
	})

	test('connect shows error when no wallet connected', async ({
		context,
		page,
		mockClearnode,
	}) => {
		await addYellowWallet(context, page, {
			address: E2E_TEVM_WALLET_ADDRESS,
			rdns: E2E_TEVM_PROVIDER_RDNS,
			name: E2E_TEVM_PROVIDER_NAME,
			clearnodeWsUrl: mockClearnode.wsUrl,
		})

		await page.goto('/positions/channels')
		await expect(
			page.getByRole('heading', { name: 'Channels', level: 1 }),
		).toBeVisible({ timeout: 60_000 })

		// Button should be disabled without wallet
		const connectBtn = page.locator('[data-yellow-connect]')
		await expect(connectBtn).toBeVisible({ timeout: 10_000 })
		await expect(connectBtn).toBeDisabled()
	})

	test('disconnect clears connection state', async ({
		context,
		page,
		mockClearnode,
	}) => {
		mockClearnode.setBalance(E2E_TEVM_WALLET_ADDRESS.toLowerCase(), 'usdc', '50.0')

		await addYellowWallet(context, page, {
			address: E2E_TEVM_WALLET_ADDRESS,
			rdns: E2E_TEVM_PROVIDER_RDNS,
			name: E2E_TEVM_PROVIDER_NAME,
			clearnodeWsUrl: mockClearnode.wsUrl,
		})

		await page.goto('/positions/channels')
		await expect(
			page.getByRole('heading', { name: 'Channels', level: 1 }),
		).toBeVisible({ timeout: 60_000 })

		// Connect via evaluate
		await connectYellowViaEval(page, E2E_TEVM_WALLET_ADDRESS)
		await expect(page.locator('[data-yellow-status="connected"]')).toBeVisible({
			timeout: 15_000,
		})

		// Disconnect via UI button
		const disconnectBtn = page.locator('[data-yellow-disconnect]')
		await expect(disconnectBtn).toBeVisible({ timeout: 5_000 })
		await disconnectBtn.click()

		// Should show disconnected
		await expect(page.locator('[data-yellow-status="disconnected"]')).toBeVisible({
			timeout: 10_000,
		})
	})
})
