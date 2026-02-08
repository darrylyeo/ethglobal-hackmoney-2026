import { expect, test } from './fixtures/tevm.ts'
import { useProfileIsolation } from './fixtures/profile.ts'
import { addTevmWallet, ensureWalletConnected } from './test-setup.ts'

test.beforeEach(async ({ context }) => {
	await useProfileIsolation(context)
})

test.describe('Wallet provider & balances (Spec 005)', () => {
	test('network toggle switches between Mainnet/Testnet label', async ({
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
		await expect(page.locator('#main').first()).toBeAttached({
			timeout: 30_000,
		})
		await expect(
			page.getByRole('heading', { name: 'USDC Bridge', level: 1, }),
		).toBeVisible({ timeout: 60_000, })
		await expect(page.locator('[data-wallet-network-label]')).toHaveText(
			'Mainnet',
			{ timeout: 15_000, },
		)
		await page.locator('[data-wallet-network-testnet]').click()
		await expect(page.locator('[data-wallet-network-label]')).toHaveText(
			'Testnet',
			{
				timeout: 5_000,
			},
		)
		await page.locator('[data-wallet-network-mainnet]').click()
		await expect(page.locator('[data-wallet-network-label]')).toHaveText(
			'Mainnet',
			{
				timeout: 5_000,
			},
		)
	})

	test('wallet menu opens when connected', async ({ context, page, tevm }) => {
		await addTevmWallet(context, page, {
			rpcUrl: tevm.rpcUrl,
			chainId: tevm.chainId,
			address: tevm.walletAddress,
			rdns: tevm.providerRdns,
			name: tevm.providerName,
		})
		await page.goto('/session#/Bridge')
		await expect(
			page.getByRole('heading', { name: 'USDC Bridge', level: 1, }),
		).toBeVisible({ timeout: 60_000, })
		await ensureWalletConnected(page)
		await page.locator('[data-wallet-menu-trigger]').click()
		await expect(page.locator('[data-wallet-disconnect]')).toBeVisible({
			timeout: 10_000,
		})
	})

	test.describe('with tevm wallet', () => {
		test.beforeEach(async ({ context, page, tevm }) => {
			await addTevmWallet(context, page, {
				rpcUrl: tevm.rpcUrl,
				chainId: tevm.chainId,
				address: tevm.walletAddress,
				rdns: tevm.providerRdns,
				name: tevm.providerName,
			})
			await page.goto('/session#/Bridge')
			await expect(page.locator('#main').first()).toBeAttached({
				timeout: 30_000,
			})
			await expect(
				page.getByRole('heading', { name: 'USDC Bridge', level: 1 }),
			).toBeVisible({ timeout: 60_000 })
		})

		test('auto-connected address displays in header', async ({ page }) => {
			await expect(page.locator('[data-wallet-address]')).toBeVisible({
				timeout: 20_000,
			})
		})

		test('balances section appears after auto-connection', async ({ page }) => {
			await expect(page.locator('[data-wallet-address]')).toBeVisible({
				timeout: 20_000,
			})
			await expect(page.locator('[data-balances-grid]')).toBeVisible({
				timeout: 30_000,
			})
		})
	})
})
