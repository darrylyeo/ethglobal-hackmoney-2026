import { expect, test } from './fixtures/tevm.js'
import {
	addTevmWallet,
	ensureWalletConnected,
	selectProtocolOption,
	selectChainOption,
} from './test-setup.js'

test.describe('Unified Bridge (Spec 037)', () => {
	test.beforeEach(async ({ context, page, tevm }) => {
		await addTevmWallet(context, page, {
			rpcUrl: tevm.rpcUrl,
			chainId: tevm.chainId,
			address: tevm.walletAddress,
			rdns: tevm.providerRdns,
			name: tevm.providerName,
		})
		await page.goto('/session#bridge')
	})

	test('unified bridge renders with chain selects, amount, protocol section', async ({
		page,
	}) => {
		await expect(page.locator('#main').first()).toBeAttached({
			timeout: 30_000,
		})
		await expect(page.locator('#main').first()).toContainText(
			/USDC Bridge|Connect a wallet/,
			{ timeout: 45_000 },
		)
		await expect(
			page.getByRole('heading', { name: 'Bridge', level: 2 }),
		).toBeVisible()
		await expect(page.getByLabel('From chain')).toBeAttached()
		await expect(page.getByLabel('To chain')).toBeAttached()
		await expect(page.getByRole('textbox', { name: 'Amount' })).toBeAttached()
		await expect(
			page.getByRole('heading', { name: 'Protocol Selection' }),
		).toBeVisible()
	})

	test('chain pair supported by both defaults to CCTP badge', async ({
		page,
	}) => {
		await expect(page.locator('#main').first()).toBeAttached({
			timeout: 30_000,
		})
		await ensureWalletConnected(page)
		await selectChainOption(page, 'From chain', 'Ethereum')
		await selectChainOption(page, 'To chain', 'OP Mainnet')
		await expect(page.locator('[data-protocol="cctp"]')).toContainText('CCTP')
		await expect(page.getByText(/Using CCTP|Only CCTP supports/)).toBeVisible()
	})

	test.fixme('chain pair that only LI.FI supports selects LI.FI', async ({
		page,
	}) => {
		await expect(page.locator('#main').first()).toBeAttached({
			timeout: 30_000,
		})
		await expect(page.locator('[data-wallet-address]')).toBeVisible({
			timeout: 15_000,
		})
		await page
			.locator('#main')
			.first()
			.evaluate((el) => {
				el.querySelector<HTMLElement>('[data-to-chain]')?.scrollIntoView({
					block: 'center',
				})
			})
		await page.getByLabel('From chain').focus()
		await page.getByLabel('From chain').press('ArrowDown')
		await page.getByLabel('From chain').fill('Celo')
		await page
			.getByRole('option', { name: 'Celo' })
			.waitFor({ state: 'visible', timeout: 15_000 })
		await page.keyboard.press('Enter')
		await page.getByLabel('To chain').focus()
		await page.getByLabel('To chain').press('ArrowDown')
		await page.getByLabel('To chain').fill('ZKsync')
		const zkOption = page.getByRole('option', { name: 'ZKsync Era' }).first()
		await zkOption.waitFor({ state: 'visible', timeout: 10_000 })
		await zkOption.evaluate((el) => (el as HTMLElement).click())
		await expect(page.locator('[data-protocol="lifi"]')).toContainText('LI.FI')
		await expect(page.getByText(/Only LI.FI supports this pair/)).toBeVisible()
	})

	test('shared pair defaults to CCTP, then Prefer LI.FI shows LI.FI', async ({
		page,
	}) => {
		await expect(page.locator('#main').first()).toBeAttached({
			timeout: 30_000,
		})
		await ensureWalletConnected(page)
		await selectChainOption(page, 'From chain', 'Ethereum')
		await selectChainOption(page, 'To chain', 'OP Mainnet')
		await expect(page.locator('[data-protocol="cctp"]')).toContainText('CCTP')
		await selectProtocolOption(page, 'LI.FI')
		await expect(
			page
				.locator('section')
				.filter({
					has: page.getByRole('heading', { name: 'Protocol Selection' }),
				})
				.getByText('LI.FI'),
		).toBeVisible({ timeout: 10_000 })
	})
})
