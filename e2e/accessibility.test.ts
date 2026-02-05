import { AxeBuilder } from '@axe-core/playwright'
import { expect, test } from './fixtures/tevm.js'
import {
	addLifiRoutesMock,
	addTevmWallet,
	ensureWalletConnected,
	selectProtocolOption,
	selectChainOption,
} from './test-setup.js'

test.describe('Accessibility (axe-core)', () => {
	test('home page has no critical violations', async ({ page }) => {
		await page.goto('/')
		await expect(page.locator('#main h1')).toBeVisible({
			timeout: 20_000,
		})
		const results = await new AxeBuilder({ page })
			.withTags(['wcag2a', 'wcag2aa'])
			.analyze()
		const critical = results.violations.filter((v) => v.impact === 'critical')
		expect(
			critical,
			critical.map((v) => v.id + ': ' + v.help).join('\n'),
		).toHaveLength(0)
	})

	test('bridge page has no critical violations', async ({ page }) => {
		await page.goto('/session#bridge')
		await expect(page.locator('#main').first()).toBeAttached({
			timeout: 30_000,
		})
		await expect(
			page
				.locator('#main')
				.first()
				.getByRole('heading', { level: 1, name: 'USDC Bridge' }),
		).toBeVisible({ timeout: 50_000 })
		const results = await new AxeBuilder({ page })
			.withTags(['wcag2a', 'wcag2aa'])
			.analyze()
		const critical = results.violations.filter((v) => v.impact === 'critical')
		expect(
			critical,
			critical.map((v) => v.id + ': ' + v.help).join('\n'),
		).toHaveLength(0)
	})

	test('transfers page has no critical violations', async ({ page }) => {
		await page.goto('/explore/usdc')
		await expect(page.locator('#main').first()).toBeAttached({
			timeout: 30_000,
		})
		const results = await new AxeBuilder({ page })
			.withTags(['wcag2a', 'wcag2aa'])
			.analyze()
		const critical = results.violations.filter((v) => v.impact === 'critical')
		expect(
			critical,
			critical.map((v) => v.id + ': ' + v.help).join('\n'),
		).toHaveLength(0)
	})

	test('rooms page has no critical violations', async ({ page }) => {
		await page.goto('/rooms')
		await expect(page.locator('#main').first()).toBeAttached({
			timeout: 30_000,
		})
		await expect(page.getByRole('heading', { name: 'Rooms' })).toBeVisible({
			timeout: 15_000,
		})
		const results = await new AxeBuilder({ page })
			.withTags(['wcag2a', 'wcag2aa'])
			.analyze()
		const critical = results.violations.filter((v) => v.impact === 'critical')
		expect(
			critical,
			critical.map((v) => v.id + ': ' + v.help).join('\n'),
		).toHaveLength(0)
	})
})

test.describe('Keyboard navigation', () => {
	test.beforeEach(async ({ context, page, tevm }) => {
		await addTevmWallet(context, page, {
			rpcUrl: tevm.rpcUrl,
			chainId: tevm.chainId,
			address: tevm.walletAddress,
			rdns: tevm.providerRdns,
			name: tevm.providerName,
		})
		await addLifiRoutesMock(page)
		await page.goto('/session#bridge')
		await expect(page.locator('#main').first()).toBeAttached({
			timeout: 30_000,
		})
		await expect(page.getByText('Loading...')).toBeHidden({ timeout: 60_000 })
		await expect(
			page
				.locator('#main')
				.first()
				.getByRole('heading', { level: 1, name: 'USDC Bridge' }),
		).toBeVisible({ timeout: 50_000 })
	})

	test('keyboard-only: connect, fill form, amount applied', async ({
		page,
	}) => {
		await ensureWalletConnected(page)
		await selectProtocolOption(page, 'LI.FI')
		await page
			.getByText('Loading networks…')
			.waitFor({ state: 'hidden', timeout: 15_000 })
		await selectChainOption(page, 'From chain', 'Ethereum')
		await selectChainOption(page, 'To chain', 'OP Mainnet')
		await page.getByRole('textbox', { name: 'Amount' }).fill('1')
		await expect(page.getByRole('textbox', { name: 'Amount' })).toHaveValue(
			'1',
		)
	})
})
