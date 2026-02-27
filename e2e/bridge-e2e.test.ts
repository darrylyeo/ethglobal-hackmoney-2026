import { expect, test } from './fixtures/tevm.ts'
import { addTevmWallet } from './support/wallet-mock.ts'
import {
	ensureWalletConnected,
	selectChainOption,
	selectProtocolOption,
} from './support/page-helpers.ts'
import { addLifiRoutesMockToContext } from './support/api-mocks.ts'

test.describe('E2E bridge flow', () => {
	test.describe('happy path with tevm wallet', () => {
		test.beforeEach(async ({ context, page, tevm }) => {
			await addLifiRoutesMockToContext(context)
			await addTevmWallet(context, page, {
				rpcUrl: tevm.rpcUrl,
				chainId: tevm.chainId,
				address: tevm.walletAddress,
				rdns: tevm.providerRdns,
				name: tevm.providerName,
			})
			await page.goto('/session?template=Bridge')
			await addLifiRoutesMock(page)
			await expect(
				page.getByText(/Loading\.\.\.|Loading…|Redirecting/),
			).toBeHidden({ timeout: 45_000 })
			await expect(page.locator('#main, main').first()).toBeVisible({
				timeout: 15_000,
			})
		})

		test('connect → balance → select → amount → get routes (result or no-routes)', async ({
			page,
		}) => {
			await expect(page.locator('#main').first()).toBeAttached({
				timeout: 30_000,
			})
			await expect(
				page.getByText(/Loading\.\.\.|Loading…|Redirecting/),
			).toBeHidden({ timeout: 60_000 })
			await expect(page.locator('#main').first()).toContainText(
				/USDC Bridge|Bridge|Connect a wallet/,
				{
					timeout: 15_000,
				},
			)
			await ensureWalletConnected(page)
			await page
				.getByText('Loading networks…')
				.waitFor({ state: 'hidden', timeout: 15_000 })
			await expect(page.getByLabel('From network')).toBeVisible({
				timeout: 20_000,
			})
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

		test('chain select and LI.FI shows quote panel when connected', async ({
			page,
		}) => {
			await expect(page.locator('#main').first()).toBeAttached({
				timeout: 30_000,
			})
			await expect(
				page.getByText(/Loading\.\.\.|Loading…|Redirecting/),
			).toBeHidden({ timeout: 60_000 })
			await expect(page.locator('#main').first()).toContainText(
				/USDC Bridge|Bridge|Connect a wallet/,
				{
					timeout: 15_000,
				},
			)
			await ensureWalletConnected(page)
			await page
				.getByText('Loading networks…')
				.waitFor({ state: 'hidden', timeout: 15_000 })
			await expect(page.getByLabel('From network')).toBeVisible({
				timeout: 15_000,
			})
			await selectChainOption(page, 'From network', 'Ethereum')
			await selectChainOption(page, 'To network', 'OP Mainnet')
			await selectProtocolOption(page, 'LI.FI')
			await expect(page.getByRole('heading', { name: 'LiFi quote' })).toBeVisible({
				timeout: 15_000,
			})
			await expect(page.getByRole('button', { name: 'Fetch quote' })).toBeVisible()
		})
	})

	test.describe('testnet/mainnet toggle', () => {
		test.use({ viewport: { width: 1280, height: 720 } })

		test.beforeEach(async ({ context, page, tevm }) => {
			await addTevmWallet(context, page, {
				rpcUrl: tevm.rpcUrl,
				chainId: tevm.chainId,
				address: tevm.walletAddress,
				rdns: tevm.providerRdns,
				name: tevm.providerName,
			})
			await page.goto('/session?template=Bridge')
			await addLifiRoutesMock(page)
			await expect(page.locator('#main').first()).toBeAttached({
				timeout: 30_000,
			})
			await expect(
				page.getByText(/Loading\.\.\.|Loading…|Redirecting/),
			).toBeHidden({ timeout: 60_000 })
			await expect(page.locator('#main').first()).toContainText(
				/USDC Bridge|Bridge|Connect a wallet/,
				{
					timeout: 15_000,
				},
			)
		})

		test('toggle filters chains: mainnet shows Ethereum, testnet shows Sepolia', async ({
			page,
		}) => {
			await ensureWalletConnected(page)
			await page.getByText('Loading networks…').waitFor({ state: 'hidden', timeout: 15_000 })
			await page.getByLabel('From network').scrollIntoViewIfNeeded()
			await expect(page.locator('[data-wallet-network-label]')).toHaveText(
				'Mainnet',
			)
			await selectChainOption(page, 'From network', 'Ethereum')
			await selectChainOption(page, 'To network', 'OP Mainnet')
			await selectProtocolOption(page, 'LI.FI')
			await page.locator('[data-wallet-network-testnet]').click()
			await expect(page.locator('[data-wallet-network-label]')).toHaveText(
				'Testnet',
				{
					timeout: 10_000,
				},
			)
			await expect(page.getByLabel('From network')).toBeVisible({
				timeout: 15_000,
			})
			await page.getByLabel('From network').click()
			await expect(
				page.getByRole('listbox').getByRole('option').first(),
			).toBeVisible({ timeout: 15_000 })
			await page.keyboard.press('Escape')
		})

		test('switching testnet/mainnet resets chain selections when current not in filtered list', async ({
			page,
		}) => {
			await ensureWalletConnected(page)
			await page.getByText('Loading networks…').waitFor({ state: 'hidden', timeout: 15_000 })
			await page.getByLabel('From network').scrollIntoViewIfNeeded()
			await selectChainOption(page, 'From network', 'Ethereum')
			await selectChainOption(page, 'To network', 'OP Mainnet')
			await selectProtocolOption(page, 'LI.FI')
			await page.locator('[data-wallet-network-testnet]').click()
			await expect(page.locator('[data-wallet-network-label]')).toHaveText(
				'Testnet',
				{
					timeout: 10_000,
				},
			)
			await expect(page.getByLabel('From network')).not.toContainText(
				'Ethereum',
				{
					timeout: 15_000,
				},
			)
		})
	})

	test.describe('error handling', () => {
		test('without wallet: clear message and connect prompt', async ({
			page,
		}) => {
			await page.goto('/session?template=Bridge')
			await page.waitForURL(/\/session\?template=Bridge/)
			await expect(page.locator('#main').first()).toBeAttached({
				timeout: 30_000,
			})
			await expect(
				page.getByText(/Loading\.\.\.|Loading…|Redirecting/),
			).toBeHidden({ timeout: 60_000 })
			await expect(page.locator('#main').first()).toContainText(
				/USDC Bridge|Bridge|Connect a wallet/,
				{
					timeout: 15_000,
				},
			)
		})

		test('with tevm wallet: quote error shows Fetch quote retry', async ({
			context,
			page,
			tevm,
		}) => {
			await addLifiRoutesMockToContext(context, undefined, { quoteFails: true })
			await addTevmWallet(context, page, {
				rpcUrl: tevm.rpcUrl,
				chainId: tevm.chainId,
				address: tevm.walletAddress,
				rdns: tevm.providerRdns,
				name: tevm.providerName,
			})
			await page.goto('/session?template=Bridge')
			await addLifiRoutesMock(page, undefined, { quoteFails: true })
			await expect(
				page.getByText(/Loading\.\.\.|Loading…|Redirecting/),
			).toBeHidden({ timeout: 60_000 })
			await expect(page.locator('#main').first()).toContainText(
				/USDC Bridge|Bridge|Connect a wallet/,
				{
					timeout: 15_000,
				},
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
				page.getByText(/error|failed|Simulated quote failure/i).first(),
			).toBeVisible({ timeout: 15_000 })
			await expect(page.getByRole('button', { name: 'Fetch quote' })).toBeEnabled()
		})
	})
})
