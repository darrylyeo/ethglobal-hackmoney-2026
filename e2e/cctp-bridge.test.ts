import { expect, test } from './fixtures/tevm.ts'
import { addTevmWallet } from './support/wallet-mock.ts'
import {
	ensureWalletConnected,
	selectChainOption,
	selectProtocolOption,
} from './support/page-helpers.ts'
import { addCctpMocks } from './support/api-mocks.ts'

test.describe('CCTP Bridge (Spec 036)', () => {
	test.beforeEach(async ({ context, page, tevm }) => {
		await addTevmWallet(context, page, {
			rpcUrl: tevm.rpcUrl,
			chainId: tevm.chainId,
			address: tevm.walletAddress,
			rdns: tevm.providerRdns,
			name: tevm.providerName,
		})
		await addCctpMocks(page)
		await page.goto('/session?template=Bridge')
		await expect(
			page.getByText(/Loading\.\.\.|Loading…|Redirecting/),
		).toBeHidden({ timeout: 45_000 })
		await expect(page.locator('#main, main').first()).toBeVisible({
			timeout: 15_000,
		})
	})

	test('select chains, enter amount, proposed transactions show CCTP steps', async ({
		page,
	}) => {
		await expect(page.locator('#main').first()).toBeAttached({
			timeout: 30_000,
		})
		await expect(page.locator('#main').first()).toContainText(
			/USDC Bridge|Bridge|Connect a wallet/,
			{ timeout: 45_000, },
		)
		await ensureWalletConnected(page)
		await page.getByText('Loading networks…').waitFor({ state: 'hidden', timeout: 15_000 })
		await selectChainOption(page, 'From network', 'Ethereum')
		await selectChainOption(page, 'To network', 'OP Mainnet')
		await selectProtocolOption(page, 'Circle CCTP')
		await page.getByRole('textbox', { name: 'Amount', }).fill('1')
		await expect(page.getByRole('textbox', { name: 'Amount', })).toHaveValue('1')
		await expect(
			page.getByText(/Approve USDC \(CCTP\)|Burn \(CCTP\)|Proposed Transaction/).first(),
		).toBeVisible({ timeout: 10_000 })
	})

	test('Fast Transfer fee and allowance displayed', async ({ page }) => {
		await expect(page.locator('#main').first()).toBeAttached({
			timeout: 30_000,
		})
		await ensureWalletConnected(page)
		await page.getByText('Loading networks…').waitFor({ state: 'hidden', timeout: 15_000 })
		await selectChainOption(page, 'From network', 'Ethereum')
		await selectChainOption(page, 'To network', 'OP Mainnet')
		await selectProtocolOption(page, 'Circle CCTP')
		await expect(page.getByText(/bps|Loading fees…|Select a valid chain pair/).first()).toBeVisible({
			timeout: 15_000,
		})
		await expect(
			page.getByText(/Fast transfer allowance|Loading allowance…|Not required/),
		).toBeVisible({ timeout: 10_000 })
	})

	test('confirmation dialog before send', async ({ page }) => {
		await expect(page.locator('#main').first()).toBeAttached({
			timeout: 30_000,
		})
		await ensureWalletConnected(page)
		await page.getByText('Loading networks…').waitFor({ state: 'hidden', timeout: 15_000 })
		await selectChainOption(page, 'From network', 'Ethereum')
		await selectChainOption(page, 'To network', 'OP Mainnet')
		await selectProtocolOption(page, 'Circle CCTP')
		await page.getByRole('textbox', { name: 'Amount', }).fill('0.01')
		await expect(page.getByRole('button', { name: 'Sign & Broadcast', })).toBeEnabled({
			timeout: 30_000,
		})
		await page.getByRole('button', { name: 'Sign & Broadcast', }).click()
		await expect(page.getByRole('dialog').getByText('Confirm CCTP transfer')).toBeVisible({
			timeout: 5_000,
		})
		await page.getByRole('button', { name: 'Cancel', }).click()
		await expect(page.getByRole('dialog')).not.toBeVisible()
	})

	test('404 attestation response continues polling (Spec 036)', async ({ page }) => {
		await page.route('**/v2/messages/**', (route) => {
			route.fulfill({ status: 404 })
		})
		await expect(page.locator('#main').first()).toBeAttached({
			timeout: 30_000,
		})
		await expect(
			page.getByText(/Loading\.\.\.|Loading…|Redirecting/),
		).toBeHidden({ timeout: 60_000 })
		await expect(page.locator('#main').first()).toContainText(
			/USDC Bridge|Bridge|Connect a wallet/,
			{ timeout: 15_000 },
		)
		await ensureWalletConnected(page)
		await page.getByText('Loading networks…').waitFor({ state: 'hidden', timeout: 15_000 })
		await selectChainOption(page, 'From network', 'Ethereum')
		await selectChainOption(page, 'To network', 'OP Mainnet')
		await selectProtocolOption(page, 'Circle CCTP')
		await page.getByRole('textbox', { name: 'Amount', }).fill('0.01')
		await expect(page.getByRole('button', { name: 'Sign & Broadcast', })).toBeEnabled({
			timeout: 30_000,
		})
		await page.getByRole('button', { name: 'Sign & Broadcast', }).click()
		await expect(page.getByRole('dialog').getByText('Confirm CCTP transfer')).toBeVisible({
			timeout: 5_000,
		})
		await page.getByRole('button', { name: 'Confirm', }).click()
		await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 10_000 })
		await expect(
			page.getByText(/Waiting for attestation|404 treated as pending/),
		).toBeVisible({ timeout: 25_000 })
		await expect(page.locator('[data-error]').filter({ hasText: /attestation|404|failed/ })).toHaveCount(0)
	})
})
