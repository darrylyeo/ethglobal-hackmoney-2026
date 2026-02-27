/**
 * E2E: Transaction simulation (Simulate button → success/failed state, optional trace/events).
 */

import { expect, test } from './fixtures/tevm.ts'
import { addTevmWallet } from './support/wallet-mock.ts'
import { ensureWalletConnected } from './support/page-helpers.ts'

const buildTransferSearch = (params: {
	fromActor: string
	toActor: string
	chainId: number
	amount: string
	tokenAddress?: string
	mode?: string
}) =>
	`?actions=${encodeURIComponent(`Transfer:${JSON.stringify({ ...params, mode: params.mode ?? 'direct' })}`)}`

test.describe('Simulation (session transfer)', () => {
	test('transfer: Simulate button runs and shows result', async ({
		context,
		page,
		tevm,
	}) => {
		test.setTimeout(90_000)
		await page.setViewportSize({ width: 1280, height: 800 })
		await addTevmWallet(context, page, {
			rpcUrl: tevm.rpcUrl,
			chainId: tevm.chainId,
			address: tevm.walletAddress,
			rdns: tevm.providerRdns,
			name: tevm.providerName,
		})
		await page.goto('/session?template=Transfer')
		await expect(
			page.getByText(/Loading\.\.\.|Loading…|Redirecting/),
		).toBeHidden({ timeout: 45_000 })
		await expect(page.locator('#main, main').first()).toBeVisible({ timeout: 15_000 })
		await expect(
			page.locator('#main').first(),
		).toContainText(/Transfer|Connect a wallet/, { timeout: 30_000 })
		await ensureWalletConnected(page)
		const search = buildTransferSearch({
			fromActor: tevm.walletAddress,
			toActor: tevm.recipientAddress,
			chainId: tevm.chainId,
			amount: '1',
			tokenAddress: '0x0000000000000000000000000000000000000000',
		})
		await page.goto(`/session${search}`)
		await expect(
			page.getByText(/Loading\.\.\.|Loading…|Redirecting/),
		).toBeHidden({ timeout: 30_000 })
		await expect(page.locator('#main, main').first()).toBeVisible({ timeout: 15_000 })
		const simulateButton = page.getByRole('button', { name: 'Simulate' })
		await expect(simulateButton).toBeVisible({ timeout: 15_000 })
		await simulateButton.click()
		await expect(simulateButton).toHaveText('Simulate', { timeout: 45_000 })
		await expect(
			page.locator('[data-e2e-simulation-status]'),
		).toBeAttached({ timeout: 15_000 })
		const status = await page
			.locator('[data-e2e-simulation-status]')
			.first()
			.getAttribute('data-e2e-simulation-status')
		expect(['success', 'failed']).toContain(status)
	})

	test('transfer: Sign & Broadcast executes', async ({
		context,
		page,
		tevm,
	}) => {
		await page.setViewportSize({ width: 1280, height: 800 })
		await addTevmWallet(context, page, {
			rpcUrl: tevm.rpcUrl,
			chainId: tevm.chainId,
			address: tevm.walletAddress,
			rdns: tevm.providerRdns,
			name: tevm.providerName,
		})
		await page.goto('/session?template=Transfer')
		await expect(
			page.getByText(/Loading\.\.\.|Loading…|Redirecting/),
		).toBeHidden({ timeout: 45_000 })
		await expect(page.locator('#main, main').first()).toBeVisible({ timeout: 15_000 })
		await expect(
			page.locator('#main').first(),
		).toContainText(/Transfer|Connect a wallet/, { timeout: 30_000 })
		await ensureWalletConnected(page)
		const search = buildTransferSearch({
			fromActor: tevm.walletAddress,
			toActor: tevm.recipientAddress,
			chainId: tevm.chainId,
			amount: '1',
			tokenAddress: '0x0000000000000000000000000000000000000000',
		})
		await page.goto(`/session${search}`)
		await expect(
			page.getByText(/Loading\.\.\.|Loading…|Redirecting/),
		).toBeHidden({ timeout: 30_000 })
		await expect(page.locator('#main, main').first()).toBeVisible({ timeout: 15_000 })
		const submitButton = page.getByRole('button', { name: 'Sign & Broadcast' })
		await expect(submitButton).toBeEnabled({ timeout: 5_000 })
		await submitButton.click()
		await expect(page.locator('[data-tx-hash]').first()).toBeVisible({
			timeout: 20_000,
		})
		const txHash = await page.locator('[data-tx-hash]').first().getAttribute('data-tx-hash')
		expect(txHash).toMatch(/^0x[a-fA-F0-9]+$/)
	})
})
