/**
 * E2E: Stork price feed — swap page subscribes to Stork (REST/WebSocket), prices appear.
 * Requires PUBLIC_STORK_REST_TOKEN set when building/serving the app.
 */

import { expect, test } from './fixtures/profile.ts'
import { useProfileIsolation } from './fixtures/profile.ts'

test.beforeEach(async ({ context }) => {
	await useProfileIsolation(context)
})

test.describe('Stork price feed', () => {
	test('session#/Swap loads and does not show missing-token error', async ({
		page,
	}) => {
		await page.goto('/session#/Swap')
		await expect(page.locator('#main').first()).toBeAttached({ timeout: 15_000 })
		await expect(page.getByText('Loading...')).toBeHidden({ timeout: 20_000 })
		await expect(
			page.getByRole('heading', { name: /Swap|Connect/i }).first(),
		).toBeVisible({ timeout: 10_000 })
		await expect(
			page.getByText('Missing PUBLIC_STORK_REST_TOKEN'),
		).not.toBeVisible({ timeout: 5_000 })
	})

	test('session#/Swap shows Stork price when amount entered and quote loads', async ({
		page,
	}) => {
		await page.goto('/session#/Swap')
		await expect(page.locator('#main').first()).toBeAttached({ timeout: 15_000 })
		await expect(page.getByText('Loading...')).toBeHidden({ timeout: 20_000 })
		const amountInput = page.locator('#swap-amount-in')
		await amountInput.waitFor({ state: 'visible', timeout: 10_000 })
		await amountInput.fill('1')
		await expect(page.getByText(/Stork:\s*1\s+\w+\s+≈/)).toBeVisible({
			timeout: 25_000,
		})
	})
})
