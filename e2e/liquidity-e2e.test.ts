/**
 * E2E: Uniswap V4 flows — swap route and liquidity.
 * Liquidity: load with ?template or ?actions params → connect tevm wallet → Add Liquidity → tx hash.
 */

import { expect, test } from './fixtures/tevm.ts'
import { addTevmWallet } from './support/wallet-mock.ts'
import { ensureWalletConnected } from './support/page-helpers.ts'

const isHexHash = (value: string | null): value is `0x${string}` =>
	typeof value === 'string' && value.startsWith('0x')

const buildActionSearch = (
	action: 'AddLiquidity',
	params: Record<string, unknown>,
) => `?actions=${encodeURIComponent(`${action}:${JSON.stringify(params)}`)}`

test.describe('Swap route', () => {
	test('session?template=Swap loads and shows swap form', async ({ page }) => {
		await page.goto('/session?template=Swap')
		await expect(page.locator('#main').first()).toBeAttached({ timeout: 15_000 })
		await expect(
			page.getByText(/Loading\.\.\.|Loading…|Redirecting/),
		).toBeHidden({ timeout: 20_000 })
		await expect(page.locator('#main')).toContainText(/Swap|Parameters|Action|Protocol|Connect/i, {
			timeout: 10_000,
		})
	})
})

test.describe('Liquidity flow E2E', () => {
	test('session?actions=AddLiquidity with tevm: connect → Sign & Broadcast → tx hash', async ({
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
		const search = buildActionSearch('AddLiquidity', {
			chainId: tevm.chainId,
			amount0: '1',
			amount1: '2',
		})
		await page.goto(`/session${search}`)
		await expect(page.locator('#main').first()).toBeAttached({ timeout: 30_000 })
		await expect(
			page.getByText(/Loading\.\.\.|Loading…|Redirecting/),
		).toBeHidden({ timeout: 60_000 })
		await expect(page.locator('#main').first()).toContainText(/Add Liquidity|Connect/, {
			timeout: 15_000,
		})
		await ensureWalletConnected(page)
		const addButton = page.getByRole('button', { name: 'Sign & Broadcast' })
		await expect(addButton).toBeEnabled({ timeout: 20_000 })
		await addButton.click()
		const txEl = page.locator('[data-tx-hash]').first()
		await txEl.waitFor({ state: 'visible', timeout: 20_000 })
		const txHash = await txEl.getAttribute('data-tx-hash')
		if (!isHexHash(txHash)) throw new Error('Missing liquidity tx hash.')
		expect(txHash).toMatch(/^0x[a-fA-F0-9]+$/)
	})
})
