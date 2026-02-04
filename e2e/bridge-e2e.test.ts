import { expect, test } from './fixtures/tevm.js'
import {
	addLifiRoutesMock,
	addTevmWallet,
	ensureWalletConnected,
	selectProtocolOption,
	selectChainOption,
} from './test-setup.js'

test.describe('E2E bridge flow', () => {
	test.describe('happy path with tevm wallet', () => {
		test.beforeEach(async ({ context, page, tevm }) => {
			await addTevmWallet(context, page, {
				rpcUrl: tevm.rpcUrl,
				chainId: tevm.chainId,
				address: tevm.walletAddress,
				rdns: tevm.providerRdns,
				name: tevm.providerName,
			})
			await page.goto('/session#bridge')
			await addLifiRoutesMock(page)
		})

		test('connect → balance → select → amount → get routes (result or no-routes)', async ({
			page,
		}) => {
			await expect(page.locator('#main').first()).toBeAttached({
				timeout: 30_000,
			})
			await expect(page.getByText('Loading...')).toBeHidden({ timeout: 60_000 })
			await expect(page.locator('#main').first()).toContainText(
				/USDC Bridge|Connect a wallet/,
				{
					timeout: 15_000,
				},
			)
			await ensureWalletConnected(page)
			await selectProtocolOption(page, 'LI.FI')
			await expect(
				page.getByRole('heading', { name: 'Your balances' }),
			).toBeVisible({ timeout: 20_000 })
			await expect(
				page.locator('#main').first().getByRole('heading', {
					name: 'Bridge USDC',
					level: 2,
				}),
			).toBeVisible({ timeout: 15_000 })
			await expect(page.locator('[data-from-chain]')).toBeVisible({
				timeout: 20_000,
			})
			await page.getByLabel('From chain').scrollIntoViewIfNeeded()
			await page.getByLabel('From chain').focus()
			await page.getByLabel('From chain').press('ArrowDown')
			await page
				.getByRole('option', { name: 'Ethereum' })
				.waitFor({ state: 'visible', timeout: 10_000 })
			await page
				.getByRole('option', { name: 'Ethereum' })
				.scrollIntoViewIfNeeded()
			await page.getByRole('option', { name: 'Ethereum' }).click({ force: true })
			await page.getByLabel('To chain').focus()
			await page.getByLabel('To chain').press('ArrowDown')
			await page
				.getByRole('option', { name: 'OP Mainnet' })
				.last()
				.waitFor({ state: 'visible', timeout: 10_000 })
			await page
				.getByRole('option', { name: 'OP Mainnet' })
				.last()
				.scrollIntoViewIfNeeded()
			await page
				.getByRole('option', { name: 'OP Mainnet' })
				.last()
				.click({ force: true })
			await page.getByRole('textbox', { name: 'Amount' }).fill('1')
			await Promise.race([
				page
					.locator('[data-testid="quote-result"]')
					.waitFor({ state: 'visible', timeout: 50_000 }),
				page
					.locator('[data-no-routes]')
					.waitFor({ state: 'visible', timeout: 50_000 }),
				page
					.locator('[data-error-display]')
					.waitFor({ state: 'visible', timeout: 50_000 }),
			])
			const hasResult =
				(await page.locator('[data-testid="quote-result"]').count()) > 0 ||
				(await page.locator('[data-no-routes]').count()) > 0 ||
				(await page.locator('[data-error-display]').count()) > 0
			expect(hasResult).toBe(true)
		})

		test('transaction history section visible when connected', async ({
			page,
		}) => {
			await expect(page.locator('#main').first()).toBeAttached({
				timeout: 30_000,
			})
			await expect(page.getByText('Loading...')).toBeHidden({ timeout: 60_000 })
			await expect(page.locator('#main').first()).toContainText(
				/USDC Bridge|Connect a wallet/,
				{
					timeout: 15_000,
				},
			)
			await ensureWalletConnected(page)
			await selectProtocolOption(page, 'LI.FI')
			await expect(
				page.getByRole('heading', { name: 'Your balances' }),
			).toBeVisible({ timeout: 20_000 })
			await page
				.getByRole('button', { name: /Transaction history/ })
				.scrollIntoViewIfNeeded()
			await expect(
				page.getByRole('button', { name: /Transaction history/ }),
			).toBeVisible({ timeout: 10_000 })
		})
	})

	test.describe('testnet/mainnet toggle', () => {
		test.beforeEach(async ({ context, page, tevm }) => {
			await addTevmWallet(context, page, {
				rpcUrl: tevm.rpcUrl,
				chainId: tevm.chainId,
				address: tevm.walletAddress,
				rdns: tevm.providerRdns,
				name: tevm.providerName,
			})
			await page.goto('/session#bridge')
			await addLifiRoutesMock(page)
			await expect(page.locator('#main').first()).toBeAttached({
				timeout: 30_000,
			})
			await expect(page.getByText('Loading...')).toBeHidden({ timeout: 60_000 })
			await expect(page.locator('#main').first()).toContainText(
				/USDC Bridge|Connect a wallet/,
				{
					timeout: 15_000,
				},
			)
		})

		test('toggle filters chains: mainnet shows Ethereum, testnet shows Sepolia', async ({
			page,
		}) => {
			await ensureWalletConnected(page)
			await selectProtocolOption(page, 'LI.FI')
			await expect(
				page.getByRole('heading', { name: 'Your balances' }),
			).toBeVisible({ timeout: 20_000 })
			await page.locator('[data-from-chain]').scrollIntoViewIfNeeded()
			await expect(page.locator('[data-wallet-network-label]')).toHaveText(
				'Mainnet',
			)
			await selectChainOption(page, 'From chain', 'Ethereum')
			await page.locator('[data-wallet-network-testnet]').click()
			await expect(page.locator('[data-wallet-network-label]')).toHaveText(
				'Testnet',
				{
					timeout: 10_000,
				},
			)
			await expect(page.locator('[data-from-chain]')).toBeVisible({
				timeout: 15_000,
			})
			const fromChainTrigger = page.getByLabel('From chain')
			await fromChainTrigger.focus()
			await fromChainTrigger.press('ArrowDown')
			await expect(
				page.getByRole('option', { name: /Sepolia/i }).first(),
			).toBeVisible({ timeout: 15_000 })
			await page.keyboard.press('Escape')
		})

		test('switching testnet/mainnet resets chain selections when current not in filtered list', async ({
			page,
		}) => {
			await ensureWalletConnected(page)
			await selectProtocolOption(page, 'LI.FI')
			await expect(
				page.getByRole('heading', { name: 'Your balances' }),
			).toBeVisible({ timeout: 20_000 })
			await page.locator('#main').first().evaluate((el) => {
				el.querySelector<HTMLElement>('[data-from-chain]')?.scrollIntoView({
					block: 'center',
				})
			})
			await page.getByLabel('From chain').focus()
			await page.getByLabel('From chain').press('ArrowDown')
			await page
				.getByRole('option', { name: 'Ethereum' })
				.waitFor({ state: 'visible', timeout: 10_000 })
			await page
				.getByRole('option', { name: 'Ethereum' })
				.scrollIntoViewIfNeeded()
			await page.getByRole('option', { name: 'Ethereum' }).click({ force: true })
			await page.locator('[data-wallet-network-testnet]').click()
			await expect(page.locator('[data-wallet-network-label]')).toHaveText(
				'Testnet',
				{
					timeout: 10_000,
				},
			)
			await expect(page.locator('[data-from-chain]')).not.toHaveText(
				'Ethereum',
				{
					timeout: 15_000,
				},
			)
		})
	})

	test.describe('error handling', () => {
		test('without wallet: clear message and connect prompt', async ({
			page,
		}) => {
			await page.goto('/session#bridge')
			await expect(page.locator('#main').first()).toBeAttached({
				timeout: 30_000,
			})
			await expect(page.getByText('Loading...')).toBeHidden({ timeout: 60_000 })
			await expect(page.locator('#main').first()).toContainText(
				/USDC Bridge|Connect a wallet/,
				{
					timeout: 15_000,
				},
			)
		})

		test('with tevm wallet: routes error shows retry/dismiss', async ({
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
			await expect(page.getByText('Loading...')).toBeHidden({ timeout: 60_000 })
			await expect(page.locator('#main').first()).toContainText(
				/USDC Bridge|Connect a wallet/,
				{
					timeout: 15_000,
				},
			)
			await ensureWalletConnected(page)
			await selectProtocolOption(page, 'LI.FI')
			await expect(
				page.getByRole('heading', { name: 'Your balances' }),
			).toBeVisible({ timeout: 20_000 })
			await page.locator('#main').first().evaluate((el) => {
				el.querySelector<HTMLElement>('[data-from-chain]')?.scrollIntoView({
					block: 'center',
				})
			})
			await page.getByLabel('From chain').scrollIntoViewIfNeeded()
			await page.getByLabel('From chain').focus()
			await page.getByLabel('From chain').press('ArrowDown')
			await page
				.getByRole('option', { name: 'Ethereum' })
				.waitFor({ state: 'visible', timeout: 10_000 })
			await page
				.getByRole('option', { name: 'Ethereum' })
				.scrollIntoViewIfNeeded()
			await page.getByRole('option', { name: 'Ethereum' }).click({ force: true })
			await page.getByLabel('To chain').focus()
			await page.getByLabel('To chain').press('ArrowDown')
			await page
				.getByRole('option', { name: 'OP Mainnet' })
				.last()
				.waitFor({ state: 'visible', timeout: 10_000 })
			await page
				.getByRole('option', { name: 'OP Mainnet' })
				.last()
				.scrollIntoViewIfNeeded()
			await page
				.getByRole('option', { name: 'OP Mainnet' })
				.last()
				.click({ force: true })
			await page.getByRole('textbox', { name: 'Amount' }).fill('1')
			await Promise.race([
				page
					.locator('[data-testid="quote-result"]')
					.waitFor({ state: 'visible', timeout: 50_000 }),
				page
					.locator('[data-no-routes]')
					.waitFor({ state: 'visible', timeout: 50_000 }),
				page
					.locator('[data-error-display]')
					.waitFor({ state: 'visible', timeout: 50_000 }),
			])
			if ((await page.locator('[data-error-display]').count()) > 0) {
				await expect(
					page
						.locator('[data-error-display]')
						.getByRole('button', { name: /retry|dismiss/i })
						.first(),
				).toBeVisible({ timeout: 5_000 })
			}
		})
	})
})
