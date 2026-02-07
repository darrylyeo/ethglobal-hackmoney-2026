/**
 * E2E: Uniswap V4 flows — swap route and liquidity (session#Swap, session#liquidity).
 * Liquidity: load with hash params → connect tevm wallet → Add Liquidity → tx hash + status.
 */

import { expect, test } from './fixtures/tevm.ts'
import { addTevmWallet, ensureWalletConnected } from './test-setup.ts'

const isHexHash = (value: string | null): value is `0x${string}` =>
	typeof value === 'string' && value.startsWith('0x')

const buildActionHash = (
	action: 'liquidity',
	params: Record<string, unknown>,
) => `#/${action}:${encodeURIComponent(JSON.stringify(params))}`

test.describe('Swap route', () => {
	test('session#Swap loads and shows swap form', async ({ page }) => {
		await page.goto('/session#/Swap')
		await expect(page.locator('#main').first()).toBeAttached({ timeout: 15_000 })
		await expect(page.getByText('Loading...')).toBeHidden({ timeout: 20_000 })
		await expect(
			page.getByRole('heading', { name: /Swap|Connect/i }).first(),
		).toBeVisible({ timeout: 10_000 })
	})
})

test.describe('Liquidity flow E2E', () => {
	test('session#liquidity with tevm: connect → Add Liquidity → tx hash and status', async ({
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
		const hash = buildActionHash('liquidity', {
			chainId: tevm.chainId,
			amount0: '1',
			amount1: '2',
		})
		await page.goto(`/session${hash}`)
		await expect(page.getByRole('heading', { name: 'Add Liquidity' })).toBeVisible({
			timeout: 15_000,
		})
		await ensureWalletConnected(page)
		const addButton = page.getByTestId('add-liquidity-submit')
		await expect(addButton).toBeEnabled({ timeout: 20_000 })
		await addButton.click()
		const statusEl = page.locator('[data-e2e-liquidity-status]')
		await statusEl.waitFor({ state: 'visible', timeout: 20_000 })
		const txHash = await statusEl.getAttribute('data-tx-hash')
		if (!isHexHash(txHash)) throw new Error('Missing liquidity tx hash.')
		await expect(statusEl).toContainText('Liquidity added.')
		expect(txHash).toMatch(/^0x[a-fA-F0-9]+$/)
	})
})
