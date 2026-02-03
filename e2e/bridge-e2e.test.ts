import { expect, test } from '@playwright/test'
import { addMockWallet, injectMockWalletInPage } from './test-setup.js'

test.describe('E2E bridge flow', () => {
	test.describe('happy path with mocked wallet', () => {
		test.beforeEach(async ({ context, page }) => {
			await addMockWallet(context, page)
			await page.goto('/bridge/lifi')
			await injectMockWalletInPage(page)
		})

		test('connect → balance → select → amount → get routes (result or no-routes)', async ({
			page,
		}) => {
			await expect(page.locator('#main-content')).toBeAttached({
				timeout: 30_000,
			})
			await expect(page.getByText('Loading...')).toBeHidden({ timeout: 60_000 })
			await expect(page.locator('#main-content')).toContainText(
				/USDC Bridge|Connect a wallet/,
				{
					timeout: 15_000,
				},
			)
			await page.getByRole('button', { name: 'Connect Wallet' }).click()
			await page
				.getByRole('menuitem', { name: 'Mock Wallet' })
				.waitFor({ state: 'visible', timeout: 10_000 })
			await page.getByRole('menuitem', { name: 'Mock Wallet' }).click({
				force: true,
			})
			await expect(page.locator('[data-wallet-address]')).toBeVisible({
				timeout: 15_000,
			})
			await expect(page.locator('[data-balances-grid]')).toBeVisible({
				timeout: 20_000,
			})
			await expect(
				page.locator('#main-content').getByRole('heading', {
					name: 'Bridge USDC',
					level: 2,
				}),
			).toBeVisible({ timeout: 15_000 })
			await expect(page.locator('[data-from-chain]')).toBeVisible({
				timeout: 20_000,
			})
			await page.getByLabel('From chain').scrollIntoViewIfNeeded()
			await page.getByLabel('From chain').focus()
			await page.getByLabel('From chain').press('ArrowDown')
			await page
				.getByRole('option', { name: 'Ethereum' })
				.waitFor({ state: 'visible', timeout: 10_000 })
			await page
				.getByRole('option', { name: 'Ethereum' })
				.scrollIntoViewIfNeeded()
			await page.getByRole('option', { name: 'Ethereum' }).click({ force: true })
			await page.getByLabel('To chain').focus()
			await page.getByLabel('To chain').press('ArrowDown')
			await page
				.getByRole('option', { name: 'OP Mainnet' })
				.last()
				.waitFor({ state: 'visible', timeout: 10_000 })
			await page
				.getByRole('option', { name: 'OP Mainnet' })
				.last()
				.scrollIntoViewIfNeeded()
			await page
				.getByRole('option', { name: 'OP Mainnet' })
				.last()
				.click({ force: true })
			await page.getByRole('textbox', { name: 'Amount' }).fill('1')
			await Promise.race([
				page
					.locator('[data-testid="quote-result"]')
					.waitFor({ state: 'visible', timeout: 50_000 }),
				page
					.locator('[data-no-routes]')
					.waitFor({ state: 'visible', timeout: 50_000 }),
				page
					.locator('[data-error-display]')
					.waitFor({ state: 'visible', timeout: 50_000 }),
			])
			const hasResult =
				(await page.locator('[data-testid="quote-result"]').count()) > 0 ||
				(await page.locator('[data-no-routes]').count()) > 0 ||
				(await page.locator('[data-error-display]').count()) > 0
			expect(hasResult).toBe(true)
		})

		test('transaction history section visible when connected', async ({
			page,
		}) => {
			await expect(page.locator('#main-content')).toBeAttached({
				timeout: 30_000,
			})
			await expect(page.getByText('Loading...')).toBeHidden({ timeout: 60_000 })
			await expect(page.locator('#main-content')).toContainText(
				/USDC Bridge|Connect a wallet/,
				{
					timeout: 15_000,
				},
			)
			await page.getByRole('button', { name: 'Connect Wallet' }).click()
			await page
				.getByRole('menuitem', { name: 'Mock Wallet' })
				.waitFor({ state: 'visible', timeout: 10_000 })
			await page.getByRole('menuitem', { name: 'Mock Wallet' }).click({
				force: true,
			})
			await expect(page.locator('[data-wallet-address]')).toBeVisible({
				timeout: 15_000,
			})
			await expect(page.locator('[data-balances-grid]')).toBeVisible({
				timeout: 20_000,
			})
			await page
				.getByRole('button', { name: /Transaction history/ })
				.scrollIntoViewIfNeeded()
			await expect(
				page.getByRole('button', { name: /Transaction history/ }),
			).toBeVisible({ timeout: 10_000 })
		})
	})

	test.describe('testnet/mainnet toggle', () => {
		test.beforeEach(async ({ context, page }) => {
			await addMockWallet(context, page)
			await page.goto('/bridge/lifi')
			await injectMockWalletInPage(page)
			await expect(page.locator('#main-content')).toBeAttached({
				timeout: 30_000,
			})
			await expect(page.getByText('Loading...')).toBeHidden({ timeout: 60_000 })
			await expect(page.locator('#main-content')).toContainText(
				/USDC Bridge|Connect a wallet/,
				{
					timeout: 15_000,
				},
			)
		})

		test('toggle filters chains: mainnet shows Ethereum, testnet shows Sepolia', async ({
			page,
		}) => {
			await page.getByRole('button', { name: 'Connect Wallet' }).click()
			await page
				.getByRole('menuitem', { name: 'Mock Wallet' })
				.waitFor({ state: 'visible', timeout: 10_000 })
			await page.getByRole('menuitem', { name: 'Mock Wallet' }).click({
				force: true,
			})
			await expect(page.locator('[data-wallet-address]')).toBeVisible({
				timeout: 15_000,
			})
			await expect(page.locator('[data-balances-grid]')).toBeVisible({
				timeout: 20_000,
			})
			await page.locator('[data-from-chain]').scrollIntoViewIfNeeded()
			await expect(page.locator('[data-wallet-network-label]')).toHaveText(
				'Mainnet',
			)
			await page.getByLabel('From chain').focus()
			await page.getByLabel('From chain').press('ArrowDown')
			await expect(
				page.getByRole('option', { name: 'Ethereum' }),
			).toBeVisible({ timeout: 10_000 })
			await page.locator('[data-wallet-network-testnet]').click()
			await expect(page.locator('[data-wallet-network-label]')).toHaveText(
				'Testnet',
				{
					timeout: 10_000,
				},
			)
			await expect(page.locator('[data-from-chain]')).toBeVisible({
				timeout: 15_000,
			})
			await page.getByLabel('From chain').focus()
			await page.getByLabel('From chain').press('ArrowDown')
			await page.getByLabel('From chain').fill('Sepolia')
			await page
				.getByRole('option', { name: /Sepolia/i })
				.first()
				.waitFor({ state: 'visible', timeout: 15_000 })
			const hasSepolia =
				(await page.getByRole('option', { name: /Sepolia/i }).count()) > 0
			expect(hasSepolia).toBe(true)
		})

		test('switching testnet/mainnet resets chain selections when current not in filtered list', async ({
			page,
		}) => {
			await page.getByRole('button', { name: 'Connect Wallet' }).click()
			await page
				.getByRole('menuitem', { name: 'Mock Wallet' })
				.waitFor({ state: 'visible', timeout: 10_000 })
			await page.getByRole('menuitem', { name: 'Mock Wallet' }).click({
				force: true,
			})
			await expect(page.locator('[data-wallet-address]')).toBeVisible({
				timeout: 15_000,
			})
			await expect(page.locator('[data-balances-grid]')).toBeVisible({
				timeout: 20_000,
			})
			await page.locator('#main-content').evaluate((el) => {
				el.querySelector<HTMLElement>('[data-from-chain]')?.scrollIntoView({
					block: 'center',
				})
			})
			await page.getByLabel('From chain').focus()
			await page.getByLabel('From chain').press('ArrowDown')
			await page
				.getByRole('option', { name: 'Ethereum' })
				.waitFor({ state: 'visible', timeout: 10_000 })
			await page
				.getByRole('option', { name: 'Ethereum' })
				.scrollIntoViewIfNeeded()
			await page.getByRole('option', { name: 'Ethereum' }).click({ force: true })
			await page.locator('[data-wallet-network-testnet]').click()
			await expect(page.locator('[data-wallet-network-label]')).toHaveText(
				'Testnet',
				{
					timeout: 10_000,
				},
			)
			await expect(page.locator('[data-from-chain]')).not.toHaveText(
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
			await page.goto('/bridge/lifi')
			await expect(page.locator('#main-content')).toBeAttached({
				timeout: 30_000,
			})
			await expect(page.getByText('Loading...')).toBeHidden({ timeout: 60_000 })
			await expect(page.locator('#main-content')).toContainText(
				/USDC Bridge|Connect a wallet/,
				{
					timeout: 15_000,
				},
			)
			await expect(
				page.getByText('Connect a wallet to get routes'),
			).toBeVisible({
				timeout: 10_000,
			})
		})

		test('with mock wallet: connect then routes error shows retry/dismiss', async ({
			context,
			page,
		}) => {
			await addMockWallet(context, page)
			await page.goto('/bridge/lifi')
			await injectMockWalletInPage(page)
			await expect(page.getByText('Loading...')).toBeHidden({ timeout: 60_000 })
			await expect(page.locator('#main-content')).toContainText(
				/USDC Bridge|Connect a wallet/,
				{
					timeout: 15_000,
				},
			)
			await page
				.getByRole('button', { name: 'Connect Wallet' })
				.scrollIntoViewIfNeeded()
			await page.getByRole('button', { name: 'Connect Wallet' }).click()
			await page
				.locator('[data-wallet-provider-option]')
				.waitFor({ state: 'visible', timeout: 10_000 })
			await page.locator('[data-wallet-provider-option]').click()
			await expect(page.locator('[data-wallet-address]')).toBeVisible({
				timeout: 15_000,
			})
			await expect(page.locator('[data-balances-grid]')).toBeVisible({
				timeout: 20_000,
			})
			await page.locator('#main-content').evaluate((el) => {
				el.querySelector<HTMLElement>('[data-from-chain]')?.scrollIntoView({
					block: 'center',
				})
			})
			await page.getByLabel('From chain').scrollIntoViewIfNeeded()
			await page.getByLabel('From chain').focus()
			await page.getByLabel('From chain').press('ArrowDown')
			await page
				.getByRole('option', { name: 'Ethereum' })
				.waitFor({ state: 'visible', timeout: 10_000 })
			await page
				.getByRole('option', { name: 'Ethereum' })
				.scrollIntoViewIfNeeded()
			await page.getByRole('option', { name: 'Ethereum' }).click({ force: true })
			await page.getByLabel('To chain').focus()
			await page.getByLabel('To chain').press('ArrowDown')
			await page
				.getByRole('option', { name: 'OP Mainnet' })
				.last()
				.waitFor({ state: 'visible', timeout: 10_000 })
			await page
				.getByRole('option', { name: 'OP Mainnet' })
				.last()
				.scrollIntoViewIfNeeded()
			await page
				.getByRole('option', { name: 'OP Mainnet' })
				.last()
				.click({ force: true })
			await page.getByRole('textbox', { name: 'Amount' }).fill('1')
			await Promise.race([
				page
					.locator('[data-testid="quote-result"]')
					.waitFor({ state: 'visible', timeout: 50_000 }),
				page
					.locator('[data-no-routes]')
					.waitFor({ state: 'visible', timeout: 50_000 }),
				page
					.locator('[data-error-display]')
					.waitFor({ state: 'visible', timeout: 50_000 }),
			])
			if ((await page.locator('[data-error-display]').count()) > 0) {
				await expect(
					page
						.locator('[data-error-display]')
						.getByRole('button', { name: /retry|dismiss/i })
						.first(),
				).toBeVisible({ timeout: 5_000 })
			}
		})
	})
})
