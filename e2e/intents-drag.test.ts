import { expect, test } from './fixtures/tevm.ts'
import { useProfileIsolation } from './fixtures/profile.ts'
import {
	buildActorCoinSeedRow,
	buildActorCoinsPayload,
} from './coverage-helpers.ts'
import { CollectionId } from '$/constants/collections.ts'
import { E2E_TEVM_CHAIN_ID, E2E_TEVM_WALLET_ADDRESS } from '$/tests/tevmConfig.ts'

test.beforeEach(async ({ context }) => {
	await useProfileIsolation(context)
})

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

	test('registered intents section shows at least the 5 spec intents', async ({
		page,
	}) => {
		await expect(
			page.getByRole('heading', { name: /Registered intents/ }),
		).toBeVisible()
		await expect(page.getByText('Swap + Bridge')).toBeVisible()
		await expect(page.getByText('Create Channel').first()).toBeVisible()
		await expect(page.getByText('Create Channel + Transfer')).toBeVisible()
		await expect(page.getByText('Add Liquidity').first()).toBeVisible()
		await expect(page.getByText('Manage Position')).toBeVisible()
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
		page,
	}) => {
		const usdcChain1 = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' as `0x${string}`
		const rows = [
			buildActorCoinSeedRow(
				E2E_TEVM_CHAIN_ID,
				E2E_TEVM_WALLET_ADDRESS,
				usdcChain1,
				'USDC',
				6,
				1_000_000n,
			),
		]
		const payload = buildActorCoinsPayload(rows)
		await page.goto('/test/intents')
		await page.evaluate(
			({ key, value }: { key: string; value: string }) => {
				localStorage.setItem(key, value)
			},
			{ key: CollectionId.ActorCoins, value: payload },
		)
		await page.reload()
		await expect(page.locator('#main').first()).toBeAttached({
			timeout: 15_000,
		})
		const balancesSection = page
			.locator('section')
			.filter({ has: page.getByRole('heading', { name: 'Balances (TanStack DB cache)' }) })
		const fromButton = balancesSection.getByRole('button', { name: 'From', exact: true }).first()
		await expect(fromButton).toBeVisible({ timeout: 10_000 })
		await fromButton.scrollIntoViewIfNeeded()
		await fromButton.click()
		await expect(
			page.getByRole('button', { name: /From \(drag source\)/ }),
		).toContainText('ActorCoin', { timeout: 10_000 })
	})
})
