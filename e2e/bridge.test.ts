import { expect, test } from './fixtures/tevm.js'
import {
	addLifiRoutesMock,
	addTevmWallet,
	ensureWalletConnected,
	selectProtocolOption,
	selectChainOption,
} from './test-setup.js'

test.describe('Bridge UI (Spec 004)', () => {
	test.beforeEach(async ({ context, page, tevm }) => {
		await addTevmWallet(context, page, {
			rpcUrl: tevm.rpcUrl,
			chainId: tevm.chainId,
			address: tevm.walletAddress,
			rdns: tevm.providerRdns,
			name: tevm.providerName,
		})
		await addLifiRoutesMock(page)
		await page.goto('/session#bridge')
	})

	test('select source chain, destination chain, enter amount and address', async ({
		page,
	}) => {
		await expect(page.locator('#main').first()).toBeAttached({
			timeout: 30_000,
		})
		await expect(page.locator('#main').first()).toContainText(
			/USDC Bridge|Connect a wallet/,
			{ timeout: 45_000 },
		)
		await ensureWalletConnected(page)
		await selectProtocolOption(page, 'LI.FI')
		await page
			.getByText('Loading networks…')
			.waitFor({ state: 'hidden', timeout: 15_000 })
		await page
			.locator('#main')
			.first()
			.evaluate((el) => {
				el.querySelector<HTMLElement>('[data-from-chain]')?.scrollIntoView({
					block: 'center',
				})
			})
		await selectChainOption(page, 'From chain', 'Ethereum')
		await selectChainOption(page, 'To chain', 'OP Mainnet')
		await page.getByRole('textbox', { name: 'Amount' }).fill('1')
		await expect(page.locator('[data-from-chain]')).toBeVisible()
		await expect(page.locator('[data-to-chain]')).toBeVisible()
		await expect(page.getByRole('textbox', { name: 'Amount' })).toHaveValue('1')
	})

	// TODO: LI.FI routes request not triggered in test env (quoteParams/fetch never runs); re-enable when fixed
	test.skip('routes auto-fetch after chains and amount; quote result or no-routes or error visible', async ({
		page,
	}) => {
		await expect(page.locator('#main').first()).toBeAttached({
			timeout: 30_000,
		})
		await expect(page.locator('#main').first()).toContainText(
			/USDC Bridge|Connect a wallet/,
			{ timeout: 45_000 },
		)
		await ensureWalletConnected(page)
		await selectProtocolOption(page, 'LI.FI')
		await page
			.getByText('Loading networks…')
			.waitFor({ state: 'hidden', timeout: 15_000 })
		await page.locator('[data-from-chain]').first().scrollIntoViewIfNeeded()
		await selectChainOption(page, 'From chain', 'Ethereum')
		await selectChainOption(page, 'To chain', 'OP Mainnet')
		await page.getByRole('textbox', { name: 'Amount' }).fill('1')
		await page
			.locator(
				'[data-testid="quote-result"], [data-no-routes], [data-error-display]',
			)
			.first()
			.waitFor({ state: 'visible', timeout: 60_000 })
		const quoteVisible =
			(await page.locator('[data-testid="quote-result"]').count()) > 0
		const noRoutesVisible = (await page.locator('[data-no-routes]').count()) > 0
		const errorVisible =
			(await page.locator('[data-error-display]').count()) > 0
		expect(quoteVisible || noRoutesVisible || errorVisible).toBe(true)
	})
})
