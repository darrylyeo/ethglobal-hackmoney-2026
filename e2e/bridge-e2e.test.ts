import { expect, test } from '@playwright/test'

async function addMockWallet(context: { addInitScript: (fn: () => void) => Promise<void> }) {
	await context.addInitScript(() => {
		const MOCK = '0x4a6B66dDF6FC5c5691571eF1bCa1FD7e406aaDce'
		window.addEventListener('eip6963:requestProvider', () => {
			window.dispatchEvent(
				new CustomEvent('eip6963:announceProvider', {
					detail: {
						info: {
							uuid: 'mock-wallet-uuid',
							name: 'Mock Wallet',
							icon: '',
							rdns: 'com.mock',
						},
						provider: {
							request: async ({ method }: { method: string }) => {
								if (method === 'eth_requestAccounts') return [MOCK]
								if (method === 'eth_chainId') return '0x1'
								return null
							},
						},
					},
				}),
			)
		})
	})
}

test.describe('E2E bridge flow', () => {
	test.describe('happy path with mocked wallet', () => {
		test.beforeEach(async ({ context, page }) => {
			await addMockWallet(context)
			await page.goto('/bridge')
		})

		test('connect → balance → select → amount → get routes (result or no-routes)', async ({
			page,
		}) => {
			await expect(page.locator('#main-content')).toBeAttached({ timeout: 30_000 })
			await expect(page.locator('#main-content')).toContainText(/USDC Bridge|Connect a wallet/, {
				timeout: 45_000,
			})
			await page.getByRole('button', { name: 'Connect Wallet' }).click()
			await page.locator('[data-wallet-provider-option]').waitFor({ state: 'visible', timeout: 10_000 })
			await page.locator('[data-wallet-provider-option]').click()
			await expect(page.locator('[data-wallet-address]')).toBeVisible({ timeout: 15_000 })
			await expect(page.locator('[data-balances-grid]')).toBeVisible({ timeout: 20_000 })
			await expect(page.getByLabel('From chain')).toBeVisible({ timeout: 20_000 })
			await expect(page.getByLabel('From chain')).toContainText('Ethereum', { timeout: 5_000 })
			await page.getByLabel('From chain').click()
			await page.getByRole('option', { name: 'Ethereum' }).click({ force: true })
			await page.getByLabel('To chain').click()
			await page.getByRole('option', { name: 'OP Mainnet' }).click({ force: true })
			await page.getByLabel('Amount').fill('1')
			await Promise.race([
				page.locator('[data-testid="quote-result"]').waitFor({ state: 'visible', timeout: 50_000 }),
				page.locator('[data-no-routes]').waitFor({ state: 'visible', timeout: 50_000 }),
				page.locator('[data-error-display]').waitFor({ state: 'visible', timeout: 50_000 }),
			])
			const hasResult =
				(await page.locator('[data-testid="quote-result"]').count()) > 0 ||
				(await page.locator('[data-no-routes]').count()) > 0 ||
				(await page.locator('[data-error-display]').count()) > 0
			expect(hasResult).toBe(true)
		})

		test('transaction history section visible when connected', async ({ page }) => {
			await expect(page.locator('#main-content')).toBeAttached({ timeout: 30_000 })
			await expect(page.locator('#main-content')).toContainText(/USDC Bridge|Connect a wallet/, {
				timeout: 45_000,
			})
			await page.getByRole('button', { name: 'Connect Wallet' }).click()
			await page.locator('[data-wallet-provider-option]').waitFor({ state: 'visible', timeout: 10_000 })
			await page.locator('[data-wallet-provider-option]').click()
			await expect(page.locator('[data-wallet-address]')).toBeVisible({ timeout: 15_000 })
			await expect(page.locator('[data-balances-grid]')).toBeVisible({ timeout: 20_000 })
			await expect(
				page.getByRole('button', { name: /Transaction history/ }),
			).toBeVisible({ timeout: 10_000 })
		})
	})

	test.describe('testnet/mainnet toggle', () => {
		test.beforeEach(async ({ context, page }) => {
			await addMockWallet(context)
			await page.goto('/bridge')
			await expect(page.locator('#main-content')).toBeAttached({ timeout: 30_000 })
			await expect(page.locator('#main-content')).toContainText(/USDC Bridge|Connect a wallet/, {
				timeout: 45_000,
			})
		})

		test('toggle filters chains: mainnet shows Ethereum, testnet shows Sepolia', async ({
			page,
		}) => {
			await page.getByRole('button', { name: 'Connect Wallet' }).click()
			await page.locator('[data-wallet-provider-option]').waitFor({ state: 'visible', timeout: 10_000 })
			await page.locator('[data-wallet-provider-option]').click()
			await expect(page.locator('[data-wallet-address]')).toBeVisible({ timeout: 15_000 })
			await expect(page.locator('[data-balances-grid]')).toBeVisible({ timeout: 20_000 })
			await expect(page.locator('[data-wallet-network-label]')).toHaveText('Mainnet')
			await expect(page.getByLabel('From chain')).toContainText('Ethereum', { timeout: 5_000 })
			await page.locator('[data-wallet-network-testnet]').click()
			await expect(page.locator('[data-wallet-network-label]')).toHaveText('Testnet', {
				timeout: 10_000,
			})
			await expect(page.getByLabel('From chain')).toBeVisible({ timeout: 15_000 })
			await page.getByLabel('From chain').click()
			await expect(page.getByRole('listbox')).toBeVisible({ timeout: 5_000 })
			const hasSepolia =
				(await page.getByRole('option', { name: /Sepolia/i }).count()) > 0
			expect(hasSepolia).toBe(true)
		})

		test('switching testnet/mainnet resets chain selections when current not in filtered list', async ({
			page,
		}) => {
			await page.getByRole('button', { name: 'Connect Wallet' }).click()
			await page.locator('[data-wallet-provider-option]').waitFor({ state: 'visible', timeout: 10_000 })
			await page.locator('[data-wallet-provider-option]').click()
			await expect(page.locator('[data-wallet-address]')).toBeVisible({ timeout: 15_000 })
			await expect(page.locator('[data-balances-grid]')).toBeVisible({ timeout: 20_000 })
			await page.getByLabel('From chain').click()
			await page.getByRole('option', { name: 'Ethereum' }).click({ force: true })
			await page.locator('[data-wallet-network-testnet]').click()
			await expect(page.locator('[data-wallet-network-label]')).toHaveText('Testnet', {
				timeout: 10_000,
			})
			await expect(page.getByLabel('From chain')).not.toHaveText('Ethereum', {
				timeout: 15_000,
			})
		})
	})

	test.describe('error handling', () => {
		test('without wallet: clear message and connect prompt', async ({ page }) => {
			await page.goto('/bridge')
			await expect(page.locator('#main-content')).toBeAttached({ timeout: 30_000 })
			await expect(page.locator('#main-content')).toContainText(/USDC Bridge|Connect a wallet/, {
				timeout: 45_000,
			})
			await expect(page.getByText('Connect a wallet to get routes')).toBeVisible({
				timeout: 10_000,
			})
		})

		test('with mock wallet: connect then routes error shows retry/dismiss', async ({
			context,
			page,
		}) => {
			await addMockWallet(context)
			await page.goto('/bridge')
			await expect(page.locator('#main-content')).toContainText(/USDC Bridge|Connect a wallet/, {
				timeout: 45_000,
			})
			await page.getByRole('button', { name: 'Connect Wallet' }).scrollIntoViewIfNeeded()
			await page.getByRole('button', { name: 'Connect Wallet' }).click()
			await page.locator('[data-wallet-provider-option]').waitFor({ state: 'visible', timeout: 10_000 })
			await page.locator('[data-wallet-provider-option]').click()
			await expect(page.locator('[data-wallet-address]')).toBeVisible({ timeout: 15_000 })
			await expect(page.locator('[data-balances-grid]')).toBeVisible({ timeout: 20_000 })
			await page.getByLabel('From chain').click()
			await page.getByRole('option', { name: 'Ethereum' }).click({ force: true })
			await page.getByLabel('To chain').click()
			await page.getByRole('option', { name: 'OP Mainnet' }).click({ force: true })
			await page.getByLabel('Amount').fill('1')
			await Promise.race([
				page.locator('[data-testid="quote-result"]').waitFor({ state: 'visible', timeout: 50_000 }),
				page.locator('[data-no-routes]').waitFor({ state: 'visible', timeout: 50_000 }),
				page.locator('[data-error-display]').waitFor({ state: 'visible', timeout: 50_000 }),
			])
			if ((await page.locator('[data-error-display]').count()) > 0) {
				await expect(
					page.locator('[data-error-display]').getByRole('button', { name: /retry|dismiss/i }).first(),
				).toBeVisible({ timeout: 5_000 })
			}
		})
	})
})
