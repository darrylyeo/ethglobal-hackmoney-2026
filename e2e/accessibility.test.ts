import { AxeBuilder } from '@axe-core/playwright'
import { expect, test } from './fixtures/tevm.ts'
import {
	addLifiRoutesMock,
	addLifiRoutesMockToContext,
	addTevmWallet,
	ensureWalletConnected,
	selectProtocolOption,
	selectChainOption,
} from './test-setup.ts'

test.describe('Accessibility (axe-core)', () => {
	test('skip link is present and points to main', async ({ page }) => {
		await page.goto('/')
		await expect(
			page.getByText(/Loading\.\.\.|Loading…|Redirecting/),
		).toBeHidden({ timeout: 30_000 })
		await expect(
			page.locator('#main, main').first(),
		).toBeVisible({ timeout: 15_000 })
		const skipLink = page.getByRole('link', { name: 'Skip to main content', })
		await expect(skipLink).toBeAttached()
		await expect(skipLink).toHaveAttribute('href', '#main')
		await expect(page.locator('#main').first()).toBeAttached()
	})

	test('skip link moves focus to main content', async ({ page }) => {
		await page.goto('/')
		await expect(
			page.getByText(/Loading\.\.\.|Loading…|Redirecting/),
		).toBeHidden({ timeout: 30_000 })
		await expect(
			page.locator('#main, main').first(),
		).toBeVisible({ timeout: 15_000 })
		const skipLink = page.getByRole('link', { name: 'Skip to main content', })
		await skipLink.click()
		await expect(page.locator('#main').first()).toBeFocused()
	})

	test('home page has no critical violations', async ({ page }) => {
		await page.goto('/')
		await expect(
			page.getByText(/Loading\.\.\.|Loading…|Redirecting/),
		).toBeHidden({ timeout: 30_000 })
		await expect(
			page.locator('#main, main').first(),
		).toBeVisible({ timeout: 15_000 })
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
		await page.goto('/session?template=Bridge')
		await expect(
			page.getByText(/Loading\.\.\.|Loading…|Redirecting/),
		).toBeHidden({ timeout: 30_000 })
		await expect(
			page.locator('#main, main').first(),
		).toBeVisible({ timeout: 15_000 })
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
		await page.goto('/coin/USDC')
		await expect(
			page.getByText(/Loading\.\.\.|Loading…|Redirecting/),
		).toBeHidden({ timeout: 30_000 })
		await expect(
			page.locator('#main, main').first(),
		).toBeVisible({ timeout: 15_000 })
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
		await expect(
			page.getByText(/Loading\.\.\.|Loading…|Redirecting/),
		).toBeHidden({ timeout: 30_000 })
		await expect(
			page.locator('#main, main').first(),
		).toBeVisible({ timeout: 15_000 })
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
		await addLifiRoutesMockToContext(context)
		await addTevmWallet(context, page, {
			rpcUrl: tevm.rpcUrl,
			chainId: tevm.chainId,
			address: tevm.walletAddress,
			rdns: tevm.providerRdns,
			name: tevm.providerName,
		})
		await page.goto('/session?template=Bridge')
		await addLifiRoutesMock(page)
		await expect(
			page.getByText(/Loading\.\.\.|Loading…|Redirecting/),
		).toBeHidden({ timeout: 45_000 })
		await expect(
			page.locator('#main, main').first(),
		).toBeVisible({ timeout: 15_000 })
		await expect(page.locator('#main').first()).toContainText(
			/USDC Bridge|Bridge|Connect a wallet/,
			{ timeout: 30_000 },
		)
	})

	test('keyboard-only: connect, fill form, amount applied', async ({
		page,
	}) => {
		await ensureWalletConnected(page)
		await page
			.getByText('Loading networks…')
			.waitFor({ state: 'hidden', timeout: 15_000 })
		await selectChainOption(page, 'From network', 'Ethereum')
		await selectChainOption(page, 'To network', 'OP Mainnet')
		await selectProtocolOption(page, 'LI.FI')
		await page.getByRole('textbox', { name: 'Amount' }).fill('1')
		await expect(page.getByRole('textbox', { name: 'Amount' })).toHaveValue('1')
	})
})
