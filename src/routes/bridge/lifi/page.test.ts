import { expect, test } from '@playwright/test'

async function addMockWallet(context: {
	addInitScript: (fn: () => void) => Promise<void>
}) {
	await context.addInitScript(() => {
		const MOCK = '0x1234567890123456789012345678901234567890'
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
								return null
							},
						},
					},
				}),
			)
		})
	})
}

test('bridge page loads and shows USDC Bridge heading', async ({ page }) => {
	await page.goto('/bridge/lifi')
	await expect(page.locator('#main-content')).toBeAttached({ timeout: 30_000 })
	await expect(
		page
			.getByRole('heading', { level: 1, name: 'USDC Bridge' })
			.or(page.getByText('Connect a wallet to get routes')),
	).toBeVisible({ timeout: 45_000 })
})

test.describe('with mock wallet and networks loaded', () => {
	test.beforeEach(async ({ context, page }) => {
		await addMockWallet(context)
		await page.goto('/bridge/lifi')
		await expect(page.locator('#main-content')).toBeAttached({
			timeout: 30_000,
		})
		await expect(
			page
				.getByRole('heading', { level: 1, name: 'USDC Bridge' })
				.or(page.getByText('Connect a wallet to get routes')),
		).toBeVisible({ timeout: 45_000 })
		await page.getByRole('button', { name: 'Connect Wallet' }).click()
		await page.locator('[data-wallet-provider-option]').click()
		await expect(page.locator('[data-wallet-address]')).toBeVisible({
			timeout: 10_000,
		})
		await page
			.getByText('Loading networks…')
			.waitFor({ state: 'hidden', timeout: 15_000 })
	})

	test('From chain select shows a real network (not empty)', async ({
		page,
	}) => {
		await expect(page.getByLabel('From chain')).toContainText('Ethereum', {
			timeout: 5_000,
		})
		await page.getByLabel('From chain').click()
		await expect(page.getByRole('listbox')).toBeVisible({ timeout: 5_000 })
		await expect(page.getByTestId('option-Ethereum')).toBeVisible({
			timeout: 5_000,
		})
	})

	test('To chain dropdown lists Ethereum and OP Mainnet', async ({ page }) => {
		await expect(page.getByLabel('From chain')).toContainText('Ethereum', {
			timeout: 5_000,
		})
		await page.getByLabel('From chain').click()
		await page.getByTestId('option-Ethereum').click()
		await page.getByLabel('To chain').click()
		const listbox = page.getByRole('listbox')
		await expect(listbox.getByRole('option', { name: 'Ethereum' })).toBeVisible(
			{
				timeout: 5_000,
			},
		)
		await expect(
			listbox.getByRole('option', { name: 'OP Mainnet' }),
		).toBeVisible({
			timeout: 5_000,
		})
	})
})
