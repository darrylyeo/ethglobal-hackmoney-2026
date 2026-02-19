import { expect, test } from './fixtures/tevm.ts'
import { useProfileIsolation } from './fixtures/profile.ts'
import {
	addTevmWallet,
	ensureWalletConnected,
	selectProtocolOption,
	selectChainOption,
} from './test-setup.ts'

test.describe('Unified Bridge (Spec 037)', () => {
	test.beforeEach(async ({ context, page, tevm }) => {
		await useProfileIsolation(context)
		await addTevmWallet(context, page, {
			rpcUrl: tevm.rpcUrl,
			chainId: tevm.chainId,
			address: tevm.walletAddress,
			rdns: tevm.providerRdns,
			name: tevm.providerName,
		})
		await page.goto('/session?template=Bridge')
	})

	test('unified bridge renders with chain selects, amount, protocol section', async ({
		page,
	}) => {
		await expect(page.locator('#main').first()).toBeAttached({
			timeout: 30_000,
		})
		await expect(page.getByText('Loading...')).toBeHidden({ timeout: 60_000 })
		await expect(page.locator('#main').first()).toContainText(
			/USDC Bridge|Bridge|Connect a wallet/,
			{ timeout: 45_000 },
		)
		await expect(page.getByLabel('From network')).toBeAttached()
		await expect(page.getByLabel('To network')).toBeAttached()
		await expect(page.getByRole('textbox', { name: 'Amount' })).toBeAttached()
		await expect(
			page.getByRole('heading', { name: 'Protocol' }),
		).toBeVisible()
	})

	test('chain pair supported by both defaults to CCTP badge', async ({
		page,
	}) => {
		await expect(page.locator('#main').first()).toBeAttached({
			timeout: 30_000,
		})
		await ensureWalletConnected(page)
		await selectChainOption(page, 'From network', 'Ethereum')
		await selectChainOption(page, 'To network', 'OP Mainnet')
		await expect(page.getByText(/Circle CCTP|Using CCTP|Only CCTP supports/)).toBeVisible({
			timeout: 10_000,
		})
	})

	test.describe('chain pair protocol selection', () => {
		test.use({ viewport: { width: 1280, height: 720 } })

		test('chain pair that only LI.FI supports selects LI.FI', async ({
		page,
	}) => {
		await expect(page.locator('#main').first()).toBeAttached({
			timeout: 30_000,
		})
		await ensureWalletConnected(page)
		await page
			.getByText('Loading networks…')
			.waitFor({ state: 'hidden', timeout: 15_000 })
		await selectChainOption(page, 'From network', 'Celo')
		await selectChainOption(page, 'To network', 'ZKsync Era')
		await expect(page.locator('[data-protocol="LiFi"]')).toContainText(
			'LI.FI',
			{ timeout: 10_000 },
		)
		await expect(
			page
				.locator('section')
				.filter({
					has: page.getByRole('heading', { name: 'Protocol' }),
				})
				.getByText('LI.FI')
				.first(),
		).toBeVisible({ timeout: 10_000 })
	})
	})

	test('shared pair defaults to CCTP, then Prefer LI.FI shows LI.FI', async ({
		page,
	}) => {
		await expect(page.locator('#main').first()).toBeAttached({
			timeout: 30_000,
		})
		await ensureWalletConnected(page)
		await selectChainOption(page, 'From network', 'Ethereum')
		await selectChainOption(page, 'To network', 'OP Mainnet')
		await expect(page.getByText(/Circle CCTP|Using CCTP/)).toBeVisible({
			timeout: 10_000,
		})
		await selectProtocolOption(page, 'LI.FI')
		await expect(
			page
				.locator('section')
				.filter({
					has: page.getByRole('heading', { name: 'Protocol' }),
				})
				.getByText('LI.FI')
				.first(),
		).toBeVisible({ timeout: 10_000 })
	})
})
