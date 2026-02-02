import { expect, test } from '@playwright/test'

async function addMockWallet(context: { addInitScript: (fn: () => void) => Promise<void> }) {
	await context.addInitScript(() => {
		const MOCK = '0x1234567890123456789012345678901234567890'
		const announce = () => {
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
							request: (args: { method: string }) =>
								Promise.resolve(
									args.method === 'eth_requestAccounts' ? [MOCK]
									: args.method === 'eth_chainId' ? '0x1'
									: args.method === 'eth_accounts' ? [MOCK]
									: null,
								),
						},
					},
				}),
			)
		}
		window.addEventListener('eip6963:requestProvider', () => {
			setTimeout(announce, 0)
		})
	})
}

test.describe('Unified Bridge (Spec 037)', () => {
	test.beforeEach(async ({ context, page }) => {
		await addMockWallet(context)
		await page.goto('/bridge')
	})

	test('unified bridge renders with chain selects, amount, protocol section', async ({
		page,
	}) => {
		await expect(page.locator('#main-content')).toBeAttached({ timeout: 30_000 })
		await expect(page.locator('#main-content')).toContainText(
			/USDC Bridge|Connect a wallet/,
			{ timeout: 45_000 },
		)
		await expect(page.getByRole('heading', { name: 'Bridge USDC' })).toBeVisible()
		await expect(page.getByLabel('From chain')).toBeAttached()
		await expect(page.getByLabel('To chain')).toBeAttached()
		await expect(page.getByLabel('Amount')).toBeAttached()
		await expect(page.getByRole('heading', { name: 'Protocol Selection' })).toBeVisible()
	})

	test('chain pair supported by both defaults to CCTP badge', async ({ page }) => {
		await expect(page.locator('#main-content')).toBeAttached({ timeout: 30_000 })
		await page.getByRole('button', { name: 'Connect Wallet' }).click()
		await page
			.locator('[data-wallet-provider-option]')
			.waitFor({ state: 'visible', timeout: 10_000 })
		await page.locator('[data-wallet-provider-option]').click()
		await expect(page.locator('[data-wallet-address]')).toBeVisible({ timeout: 15_000 })
		await page.getByLabel('From chain').click()
		await page.getByRole('option', { name: 'Ethereum' }).click({ force: true })
		await page.getByLabel('To chain').click()
		await page.getByRole('option', { name: 'Base' }).click({ force: true })
		await expect(page.locator('[data-badge][data-protocol="cctp"]')).toContainText('CCTP')
		await expect(page.getByText(/Defaulting to CCTP|Preferring CCTP/)).toBeVisible()
	})

	test('chain pair that only LI.FI supports selects LI.FI', async ({ page }) => {
		await expect(page.locator('#main-content')).toBeAttached({ timeout: 30_000 })
		await page.getByRole('button', { name: 'Connect Wallet' }).click()
		await page
			.locator('[data-wallet-provider-option]')
			.waitFor({ state: 'visible', timeout: 10_000 })
		await page.locator('[data-wallet-provider-option]').click()
		await expect(page.locator('[data-wallet-address]')).toBeVisible({ timeout: 15_000 })
		await page.getByLabel('From chain').click()
		await page.getByRole('option', { name: 'Celo' }).click({ force: true })
		await page.getByLabel('To chain').click()
		await page.getByRole('option', { name: 'ZKsync Era' }).click({ force: true })
		await expect(page.locator('[data-badge][data-protocol="lifi"]')).toContainText('LI.FI')
		await expect(page.getByText(/Only LI.FI supports this pair/)).toBeVisible()
	})

	test('shared pair defaults to CCTP, then Prefer LI.FI shows LI.FI, Continue goes to /bridge/lifi', async ({
		page,
	}) => {
		await expect(page.locator('#main-content')).toBeAttached({ timeout: 30_000 })
		await page.getByRole('button', { name: 'Connect Wallet' }).click()
		await page
			.locator('[data-wallet-provider-option]')
			.waitFor({ state: 'visible', timeout: 10_000 })
		await page.locator('[data-wallet-provider-option]').click()
		await expect(page.locator('[data-wallet-address]')).toBeVisible({ timeout: 15_000 })
		await page.getByLabel('From chain').click()
		await page.getByRole('option', { name: 'Ethereum' }).click({ force: true })
		await page.getByLabel('To chain').click()
		await page.getByRole('option', { name: 'Base' }).click({ force: true })
		await expect(page.locator('[data-badge][data-protocol="cctp"]')).toContainText('CCTP')
		await page.getByRole('button', { name: 'Prefer LI.FI' }).click()
		await expect(page.locator('[data-badge][data-protocol="lifi"]')).toContainText('LI.FI')
		await page.getByLabel('Amount').fill('1')
		await page.getByRole('button', { name: 'Continue to LI.FI' }).click()
		await expect(page).toHaveURL(/\/bridge\/lifi/)
	})
})

test.describe('Unified Bridge routing (Spec 037)', () => {
	test('/bridge/lifi renders LI.FI bridge UI', async ({ page }) => {
		await page.goto('/bridge/lifi')
		await expect(page.locator('#main-content')).toBeAttached({ timeout: 30_000 })
		await expect(page.locator('#main-content')).toContainText(/USDC Bridge|Connect a wallet/)
		await expect(page.getByLabel('From chain')).toBeAttached()
		await expect(page.getByLabel('To chain')).toBeAttached()
	})

	test('/bridge/cctp renders CCTP bridge UI', async ({ page }) => {
		await page.goto('/bridge/cctp')
		await expect(page.locator('#main-content')).toBeAttached({ timeout: 30_000 })
		await expect(page.locator('#main-content')).toContainText(
			/USDC Bridge \(CCTP\)|Connect a wallet/,
		)
		await expect(page.getByLabel('From chain')).toBeAttached()
		await expect(page.getByLabel('To chain')).toBeAttached()
	})

	test('/bridge renders unified bridge UI', async ({ page }) => {
		await page.goto('/bridge')
		await expect(page.locator('#main-content')).toBeAttached({ timeout: 30_000 })
		await expect(page.getByRole('heading', { name: 'Protocol Selection' })).toBeVisible()
	})
})
