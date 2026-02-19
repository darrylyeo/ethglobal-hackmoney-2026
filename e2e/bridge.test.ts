import { expect, test } from './fixtures/tevm.ts'
import { useProfileIsolation } from './fixtures/profile.ts'
import {
	addLifiRoutesMock,
	addTevmWallet,
	ensureWalletConnected,
	selectProtocolOption,
	selectChainOption,
} from './test-setup.ts'

test.describe('Bridge UI (Spec 004)', () => {
	test.beforeEach(async ({ context, page, tevm }) => {
		await useProfileIsolation(context)
		await addTevmWallet(context, page, {
			rpcUrl: tevm.rpcUrl,
			chainId: tevm.chainId,
			address: tevm.walletAddress,
			rdns: tevm.providerRdns,
			name: tevm.providerName,
		})
		await addLifiRoutesMock(page)
		await page.goto('/session?template=Bridge')
	})

	test('select source chain, destination chain, enter amount and address', async ({
		page,
	}) => {
		await expect(page.locator('#main').first()).toBeAttached({
			timeout: 30_000,
		})
		await expect(page.getByText('Loading...')).toBeHidden({ timeout: 60_000 })
		await expect(page.locator('#main').first()).toContainText(
			/USDC Bridge|Bridge|Connect a wallet/,
			{ timeout: 15_000, },
		)
		await ensureWalletConnected(page)
		await page
			.getByText('Loading networks…')
			.waitFor({ state: 'hidden', timeout: 15_000, })
		await selectChainOption(page, 'From network', 'Ethereum')
		await selectChainOption(page, 'To network', 'OP Mainnet')
		await selectProtocolOption(page, 'LI.FI')
		await page.getByRole('textbox', { name: 'Amount', }).fill('1')
		await expect(page.getByLabel('From network')).toBeVisible()
		await expect(page.getByLabel('To network')).toBeVisible()
		await expect(page.getByRole('textbox', { name: 'Amount', })).toHaveValue('1')
	})

	test('LI.FI quote: fetch shows steps or error', async ({ page }) => {
		await expect(page.locator('#main').first()).toBeAttached({
			timeout: 30_000,
		})
		await expect(page.getByText('Loading...')).toBeHidden({ timeout: 60_000 })
		await expect(page.locator('#main').first()).toContainText(
			/USDC Bridge|Bridge|Connect a wallet/,
			{ timeout: 15_000 },
		)
		await ensureWalletConnected(page)
		await page
			.getByText('Loading networks…')
			.waitFor({ state: 'hidden', timeout: 15_000 })
		await selectChainOption(page, 'From network', 'Ethereum')
		await selectChainOption(page, 'To network', 'OP Mainnet')
		await selectProtocolOption(page, 'LI.FI')
		await page.getByRole('textbox', { name: 'Amount', }).fill('1')
		const fetchBtn = page.getByRole('button', { name: 'Fetch quote' })
		await expect(fetchBtn).toBeEnabled({ timeout: 15_000 })
		await fetchBtn.click()
		await expect(
			page.getByText(/step\(s\) ready|No transaction|Fetch again|Fetching/),
		).toBeVisible({ timeout: 30_000 })
	})
})
