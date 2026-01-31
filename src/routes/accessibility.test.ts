import { AxeBuilder } from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

test.describe('Accessibility (axe-core)', () => {
	test('home page has no critical violations', async ({ page }) => {
		await page.goto('/')
		await expect(page.locator('h1')).toBeVisible({ timeout: 20_000 })
		const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()
		const critical = results.violations.filter((v) => v.impact === 'critical')
		expect(critical, critical.map((v) => v.id + ': ' + v.help).join('\n')).toHaveLength(0)
	})

	test('bridge page has no critical violations', async ({ page }) => {
		await page.goto('/bridge')
		await expect(page.locator('#main-content')).toBeAttached({ timeout: 30_000 })
		await expect(
			page.getByRole('heading', { level: 1, name: 'USDC Bridge' }).or(
				page.getByText('Connect a wallet to get routes'),
			),
		).toBeVisible({ timeout: 50_000 })
		const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()
		const critical = results.violations.filter((v) => v.impact === 'critical')
		expect(critical, critical.map((v) => v.id + ': ' + v.help).join('\n')).toHaveLength(0)
	})
})

test.describe('Keyboard navigation', () => {
	test.beforeEach(async ({ context, page }) => {
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
		await page.goto('/bridge')
		await expect(page.locator('#main-content')).toBeAttached({ timeout: 30_000 })
		await expect(
			page.getByRole('heading', { level: 1, name: 'USDC Bridge' }).or(
				page.getByText('Connect a wallet to get routes'),
			),
		).toBeVisible({ timeout: 50_000 })
	})

	test('keyboard-only: Connect Wallet and Get Routes reachable via Tab', async ({ page }) => {
		for (let i = 0; i < 30; i++) {
			await page.keyboard.press('Tab')
			const text = await page.evaluate(
				() => (document.activeElement as HTMLElement)?.textContent?.trim().slice(0, 40),
			)
			if (text?.includes('Connect Wallet')) break
		}
		await expect(page.getByRole('button', { name: 'Connect Wallet' })).toBeFocused()
		await page.keyboard.press('Enter')
		await page.locator('[data-wallet-provider-option]').waitFor({ state: 'visible', timeout: 5_000 })
		await page.keyboard.press('Tab')
		await page.keyboard.press('Enter')
		await expect(page.locator('[data-wallet-address]')).toBeVisible({ timeout: 10_000 })
		await page.getByText('Loading networks…').waitFor({ state: 'hidden', timeout: 15_000 })
		await page.getByLabel('From chain').click()
		await page.getByRole('option', { name: 'Ethereum' }).click({ force: true })
		await page.getByLabel('To chain').click()
		await page.getByRole('option', { name: 'OP Mainnet' }).click({ force: true })
		await page.getByLabel('Amount').fill('1')
		for (let i = 0; i < 20; i++) {
			await page.keyboard.press('Tab')
			const text = await page.evaluate(
				() => (document.activeElement as HTMLElement)?.textContent?.trim(),
			)
			if (text === 'Get Routes') break
		}
		await expect(page.getByRole('button', { name: 'Get Routes' })).toBeFocused()
	})
})
