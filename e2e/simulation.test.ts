/**
 * E2E: Transaction simulation (Simulate button → success/failed state, optional trace/events).
 */

import { expect, test } from './fixtures/tevm.ts'
import { useProfileIsolation } from './fixtures/profile.ts'
import { addTevmWallet, ensureWalletConnected } from './test-setup.ts'

test.beforeEach(async ({ context }) => {
	await useProfileIsolation(context)
})

const buildTransferHash = (params: {
	fromActor: string
	toActor: string
	chainId: number
	amount: string
	mode?: string
}) =>
	`#transfer:${encodeURIComponent(JSON.stringify({ ...params, mode: params.mode ?? 'direct' }))}`

test.describe('Simulation (session transfer)', () => {
	test('transfer: Simulate button runs and shows success', async ({
		context,
		page,
		tevm,
	}) => {
		await addTevmWallet(context, page, {
			rpcUrl: tevm.rpcUrl,
			chainId: tevm.chainId,
			address: tevm.walletAddress,
			rdns: tevm.providerRdns,
			name: tevm.providerName,
		})
		await page.goto('/session#/Bridge')
		await expect(page.locator('#main').first()).toBeAttached({ timeout: 30_000 })
		await expect(
			page.getByRole('heading', { name: 'USDC Bridge', level: 1 }),
		).toBeVisible({ timeout: 60_000 })
		await ensureWalletConnected(page)
		const hash = buildTransferHash({
			fromActor: tevm.walletAddress,
			toActor: tevm.recipientAddress,
			chainId: tevm.chainId,
			amount: '1',
		})
		await page.goto(`/session${hash}`)
		await expect(page.locator('#main').first()).toBeAttached({ timeout: 15_000 })
		const simulateButton = page.getByRole('button', { name: 'Simulate' })
		await expect(simulateButton).toBeVisible({ timeout: 15_000 })
		await simulateButton.click()
		await expect(
			page.locator('[data-e2e-simulation-status="success"]'),
		).toBeVisible({ timeout: 10_000 })
		await expect(page.getByText('Simulation ok')).toBeVisible()
	})

	test('transfer: after simulation success, Sign and Submit still executes', async ({
		context,
		page,
		tevm,
	}) => {
		await addTevmWallet(context, page, {
			rpcUrl: tevm.rpcUrl,
			chainId: tevm.chainId,
			address: tevm.walletAddress,
			rdns: tevm.providerRdns,
			name: tevm.providerName,
		})
		await page.goto('/session#/Bridge')
		await expect(page.locator('#main').first()).toBeAttached({ timeout: 30_000 })
		await expect(
			page.getByRole('heading', { name: 'USDC Bridge', level: 1 }),
		).toBeVisible({ timeout: 60_000 })
		await ensureWalletConnected(page)
		const hash = buildTransferHash({
			fromActor: tevm.walletAddress,
			toActor: tevm.recipientAddress,
			chainId: tevm.chainId,
			amount: '1',
		})
		await page.goto(`/session${hash}`)
		await expect(page.locator('#main').first()).toBeAttached({ timeout: 15_000 })
		const simulateButton = page.getByRole('button', { name: 'Simulate' })
		await expect(simulateButton).toBeVisible({ timeout: 15_000 })
		await simulateButton.click()
		await expect(
			page.locator('[data-e2e-simulation-status="success"]'),
		).toBeVisible({ timeout: 10_000 })
		const submitButton = page.getByRole('button', { name: 'Sign and Submit' })
		await expect(submitButton).toBeEnabled({ timeout: 5_000 })
		await submitButton.click()
		await expect(page.locator('[data-tx-hash]').first()).toBeVisible({
			timeout: 20_000,
		})
		const txHash = await page.locator('[data-tx-hash]').first().getAttribute('data-tx-hash')
		expect(txHash).toMatch(/^0x[a-fA-F0-9]+$/)
	})
})
