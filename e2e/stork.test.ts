/**
 * E2E: Stork price feed — swap page subscribes to Stork (REST/WebSocket), prices appear.
 * Requires PUBLIC_STORK_REST_TOKEN set when building/serving the app.
 */

import { expect, test } from './fixtures/profile.ts'

test.describe('Stork price feed', () => {
	test('session#/Swap loads and does not show missing-token error', async ({
		page,
	}) => {
		await page.goto('/session?template=Swap')
		await expect(page.locator('#main').first()).toBeAttached({ timeout: 15_000 })
		await expect(
			page.getByText(/Loading\.\.\.|Loading…|Redirecting/),
		).toBeHidden({ timeout: 20_000 })
		await expect(
			page.getByRole('heading', { name: /Session|Swap|Connect/i }).first(),
		).toBeVisible({ timeout: 10_000 })
		await expect(
			page.getByText('Missing PUBLIC_STORK_REST_TOKEN'),
		).not.toBeVisible({ timeout: 5_000 })
	})

	test('session#/Swap form accepts amount and shows balance/value UI', async ({
		page,
	}) => {
		await page.goto('/session?template=Swap')
		await expect(page.locator('#main').first()).toBeAttached({ timeout: 15_000 })
		await expect(
			page.getByText(/Loading\.\.\.|Loading…|Redirecting/),
		).toBeHidden({ timeout: 20_000 })
		const amountInput = page.getByLabel('Amount in')
		await amountInput.waitFor({ state: 'visible', timeout: 10_000 })
		await amountInput.fill('1')
		await expect(amountInput).toHaveValue('1')
		await expect(page.locator('#main').first()).toContainText(
			/Total value ≈|≈ \$|Parameters|Protocol/,
			{ timeout: 15_000 },
		)
	})
})
