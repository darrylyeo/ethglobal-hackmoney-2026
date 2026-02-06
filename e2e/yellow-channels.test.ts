/**
 * E2E: Yellow state channel lifecycle.
 * Tests: connect → create channel → send transfer → close channel.
 */

import { test, expect } from './fixtures/mock-clearnode.js'
import { ensureWalletConnected } from './test-setup.js'
import {
	E2E_TEVM_WALLET_ADDRESS,
	E2E_TEVM_PROVIDER_NAME,
	E2E_TEVM_PROVIDER_RDNS,
} from '../src/lib/e2e/tevm-config.js'

const MOCK_SIGNATURE = ('0x' + 'ab'.repeat(32) + 'cd'.repeat(32) + '1b') as `0x${string}`

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
		const mockSig = ('0x' + 'ab'.repeat(32) + 'cd'.repeat(32) + '1b')
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
				// Mock EIP-712 signing (clearnode doesn't verify)
				if (args.method === 'eth_signTypedData_v4' || args.method === 'eth_signTypedData') {
					return mockSig
				}
				// Mock personal_sign
				if (args.method === 'personal_sign') {
					return mockSig
				}
				return null
			},
			on: (event: string, handler: (payload: unknown) => void) => {
				listeners.set(event, [...(listeners.get(event) ?? []), handler])
				return provider
			},
			removeListener: (event: string, handler: (payload: unknown) => void) => {
				listeners.set(
					event,
					(listeners.get(event) ?? []).filter((h) => h !== handler),
				)
				return provider
			},
		}
		const detail = {
			info: {
				uuid: 'yellow-e2e-wallet',
				name: o.name,
				icon: '',
				rdns: o.rdns,
			},
			provider,
		}
		Object.assign(window, { __E2E_TEVM_PROVIDER__: detail })
		const announce = () => {
			window.dispatchEvent(
				new CustomEvent('eip6963:announceProvider', { detail }),
			)
		}
		window.addEventListener('eip6963:requestProvider', () => announce())
		for (const ms of [0, 50, 150, 300, 500, 800, 1200]) {
			setTimeout(announce, ms)
		}
	}
	await context.addInitScript(initScript, opts)
	if (page) await page.addInitScript(initScript, opts)
}

test.describe('Yellow state channel lifecycle (Spec 032)', () => {
	test('full lifecycle: connect → create channel → transfer → close', async ({
		context,
		page,
		mockClearnode,
	}) => {
		// Seed initial balance
		mockClearnode.setBalance(E2E_TEVM_WALLET_ADDRESS.toLowerCase(), 'usdc', '100.0')

		await addYellowWallet(context, page, {
			address: E2E_TEVM_WALLET_ADDRESS,
			rdns: E2E_TEVM_PROVIDER_RDNS,
			name: E2E_TEVM_PROVIDER_NAME,
			clearnodeWsUrl: mockClearnode.wsUrl,
		})

		// Connect wallet on /session page first (has wallet connect UI)
		await page.goto('/session')
		await expect(page.locator('#main').first()).toBeAttached({ timeout: 30_000 })
		await ensureWalletConnected(page)

		// Navigate to channels page
		await page.goto('/channels/yellow')
		await expect(
			page.getByRole('heading', { name: 'Yellow Channels', level: 1 }),
		).toBeVisible({ timeout: 60_000 })

		// Should show "Disconnected" and "Connect to Yellow" button
		await expect(page.locator('[data-yellow-status="disconnected"]')).toBeVisible({
			timeout: 10_000,
		})
		const connectBtn = page.locator('[data-yellow-connect]')
		await expect(connectBtn).toBeVisible({ timeout: 5_000 })

		// Step 2: Connect to Yellow clearnode
		await connectBtn.click()

		// Wait for connection to establish
		await expect(page.locator('[data-yellow-status="connected"]')).toBeVisible({
			timeout: 30_000,
		})

		// Step 3: Create a channel
		const createBtn = page.locator('[data-yellow-create-channel]')
		await expect(createBtn).toBeVisible({ timeout: 5_000 })
		await createBtn.click()

		// Wait for channel to appear in the table
		await expect(page.locator('tbody tr').first()).toBeVisible({
			timeout: 15_000,
		})

		// Verify channel shows "active" status
		await expect(page.locator('tbody tr').first().locator('[data-status]')).toHaveText(
			'active',
			{ timeout: 10_000 },
		)

		// Step 4: Send a transfer
		const sendBtn = page.locator('tbody tr').first().getByRole('button', { name: 'Send' })
		await expect(sendBtn).toBeVisible({ timeout: 5_000 })
		await sendBtn.click()

		// Fill in transfer amount in dialog
		const amountInput = page.locator('input[placeholder="Amount (USDC)"]')
		await expect(amountInput).toBeVisible({ timeout: 10_000 })
		await amountInput.fill('5.0')

		const sendTransferBtn = page.getByRole('button', { name: 'Send', exact: true }).last()
		await sendTransferBtn.click()

		// Dialog should close after successful transfer
		await expect(amountInput).not.toBeVisible({ timeout: 10_000 })

		// Step 5: Close the channel
		const closeBtn = page.locator('tbody tr').first().getByRole('button', { name: 'Close' })
		await expect(closeBtn).toBeVisible({ timeout: 5_000 })
		await closeBtn.click()

		// Channel should update to "closed" status
		await expect(
			page.locator('tbody tr').first().locator('[data-status]'),
		).toHaveText('closed', { timeout: 15_000 })

		// Verify mock clearnode state
		expect(mockClearnode.state.transfers.length).toBeGreaterThan(0)
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

		await page.goto('/channels/yellow')
		await expect(
			page.getByRole('heading', { name: 'Yellow Channels', level: 1 }),
		).toBeVisible({ timeout: 60_000 })

		// Don't connect wallet - just try to connect to Yellow
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

		// Connect wallet on /session page first
		await page.goto('/session')
		await expect(page.locator('#main').first()).toBeAttached({ timeout: 30_000 })
		await ensureWalletConnected(page)

		await page.goto('/channels/yellow')
		await expect(
			page.getByRole('heading', { name: 'Yellow Channels', level: 1 }),
		).toBeVisible({ timeout: 60_000 })

		// Connect
		const connectBtn = page.locator('[data-yellow-connect]')
		await expect(connectBtn).toBeVisible({ timeout: 10_000 })
		await connectBtn.click()
		await expect(page.locator('[data-yellow-status="connected"]')).toBeVisible({
			timeout: 30_000,
		})

		// Disconnect
		const disconnectBtn = page.locator('[data-yellow-disconnect]')
		await expect(disconnectBtn).toBeVisible({ timeout: 5_000 })
		await disconnectBtn.click()

		// Should show disconnected
		await expect(page.locator('[data-yellow-status="disconnected"]')).toBeVisible({
			timeout: 10_000,
		})
	})
})
