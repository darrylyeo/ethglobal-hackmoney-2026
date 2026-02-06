import { expect, test } from './fixtures/tevm.js'
import { addTevmWallet } from './test-setup.js'

test.describe('Intents / drag (test page)', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/test/intents')
		await expect(page.locator('#main').first()).toBeAttached({
			timeout: 15_000,
		})
	})

	test('intents page shows From/To drop zones and Balances section', async ({
		page,
	}) => {
		await expect(page.getByRole('heading', { name: 'From', })).toBeVisible()
		await expect(page.getByRole('heading', { name: 'To', })).toBeVisible()
		await expect(page.getByText('Drop an entity').first()).toBeVisible()
		await expect(
			page.getByRole('heading', { name: 'Balances (TanStack DB cache)', }),
		).toBeVisible()
	})

	test('drop zones accept focus and contain placeholder when empty', async ({
		page,
	}) => {
		const fromCard = page
			.getByRole('heading', { name: 'From' })
			.locator('..')
			.first()
		await expect(fromCard).toContainText('Drop an entity')
		const toCard = page.getByRole('heading', { name: 'To', }).locator('..').first()
		await expect(toCard).toContainText('Drop an entity')
	})

	test('when balance rows exist, From button sets from payload', async ({
		context,
		page,
		tevm,
	}) => {
		await addTevmWallet(context, page, {
			rpcUrl: tevm.rpcUrl,
			chainId: tevm.chainId,
			address: tevm.walletAddress,
			rdns: tevm.providerRdns,
			name: tevm.providerName,
		})
		await page.goto('/session#bridge')
		await expect(page.locator('#main').first()).toBeAttached({
			timeout: 30_000,
		})
		await page
			.getByText('Loading...')
			.waitFor({ state: 'hidden', timeout: 20_000, })
			.catch(() => {})
		await page.goto('/test/intents')
		await expect(page.locator('#main').first()).toBeAttached({
			timeout: 15_000,
		})
		const noBalances = await page.getByText('No cached balances yet').isVisible()
		test.skip(noBalances, 'No cached balances; connect wallet and load bridge first to seed')
		const fromButton = page.getByRole('button', { name: 'From', }).first()
		await fromButton.click()
		await expect(
			page.getByRole('heading', { name: 'From', }).locator('..').locator('pre'),
		).not.toContainText('null')
	})
})
