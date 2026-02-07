import { expect, test } from './fixtures/tevm.ts'
import { addTevmWallet } from './test-setup.ts'

test.describe('Intents test page (/test/intents)', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/test/intents')
		await expect(page.locator('#main').first()).toBeAttached({
			timeout: 15_000,
		})
	})

	test('renders page heading and all sections', async ({ page }) => {
		await expect(
			page.getByRole('heading', { name: 'Entity intents', level: 1 }),
		).toBeVisible()
		await expect(
			page.getByRole('heading', { name: /Registered intents/ }),
		).toBeVisible()
		await expect(
			page.getByRole('heading', { name: 'Intent slots' }),
		).toBeVisible()
		await expect(
			page.getByRole('heading', { name: 'Balances (TanStack DB cache)' }),
		).toBeVisible()
		await expect(
			page.getByRole('heading', { name: 'Resolved intent' }),
		).toBeVisible()
	})

	test('shows all 5 registered intents', async ({ page }) => {
		await expect(
			page.getByRole('heading', { name: 'Registered intents (5)' }),
		).toBeVisible()

		await expect(page.getByText('Swap + Bridge')).toBeVisible()
		await expect(page.getByText('Create Channel').first()).toBeVisible()
		await expect(page.getByText('Create Channel + Transfer')).toBeVisible()
		await expect(page.getByText('Add Liquidity').first()).toBeVisible()
		await expect(page.getByText('Remove Liquidity').first()).toBeVisible()
	})

	test('intent slots show drop placeholders', async ({ page }) => {
		await expect(page.getByText('From (drag source)')).toBeVisible()
		await expect(page.getByText('To (drop target)')).toBeVisible()
		const dropPlaceholders = page.getByText('Drop an entity')
		await expect(dropPlaceholders.first()).toBeVisible()
		await expect(dropPlaceholders.nth(1)).toBeVisible()
	})

	test('resolved intent section shows "Select two entities" by default', async ({
		page,
	}) => {
		await expect(page.getByText('Select two entities.')).toBeVisible()
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
			.waitFor({ state: 'hidden', timeout: 20_000 })
			.catch(() => {})
		await page.goto('/test/intents')
		await expect(page.locator('#main').first()).toBeAttached({
			timeout: 15_000,
		})
		const noBalances = await page.getByText('No cached balances yet').isVisible()
		test.skip(
			noBalances,
			'No cached balances; connect wallet and load bridge first to seed',
		)
		const fromButton = page.getByRole('button', { name: 'From' }).first()
		await fromButton.click()
		await expect(
			page.getByText('From (drag source)').locator('..').locator('pre'),
		).not.toContainText('null')
	})
})
