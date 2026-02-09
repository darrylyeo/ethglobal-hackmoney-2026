import { expect, type BrowserContext, type Page } from '@playwright/test'
import { APP_NAME } from '$/constants/app.ts'
import { ActionType } from '$/constants/intents.ts'
import {
	buildLocalStoragePayload,
	buildSessionRow,
	seedLocalStorageCollectionViaPage,
	type SessionRow,
} from './coverage-helpers.ts'

const coverageBaseURL = 'http://localhost:4173'

export type CoverageScenario = {
	route: string
	branch: string
	path: string
	setup?: (context: BrowserContext, page: Page) => Promise<void>
	assert: (page: Page) => Promise<void>
}

export const routeBranchRequirements: Record<string, string[]> = {
	'/': ['default'],
	'/about': ['default'],
	'/about-old': ['default'],
	'/about-old-2': ['default'],
	'/dashboard': ['default'],
	'/rooms': ['join-disabled', 'join-enabled'],
	'/rooms/[roomId]': ['share', 'peers-empty'],
	'/rooms/[roomId]/channels': ['default'],
	'/session': ['swap', 'bridge', 'transfer', 'liquidity', 'createChannel', 'addChannelMember', 'closeChannel', 'addLiquidity', 'removeLiquidity', 'collectFees', 'increaseLiquidity', 'shareAddress', 'proposeTransfer', 'requestVerification', 'unsupported'],
	'/session/[id]': ['not-found', 'redirect'],
	'/sessions': ['empty', 'populated'],
	'/positions/channels': ['default'],
	'/positions/liquidity': ['default'],
	'/coin/[symbol]': ['usdc', 'eth', 'not-found'],
	'/test/chain-id': ['button-disabled', 'button-enabled'],
	'/transfers': ['default'],
	'/wallets': ['default'],
	'/test/collections': ['default'],
	'/test/intents': ['default'],
	'/test/networks-coins': ['default'],
	'/accounts': ['default'],
	'/account/[address]': ['valid-address', 'invalid-address'],
	'/peers': ['default'],
	'/network/[name]': ['default'],
	'/network/[name]/block/[blockNumber]': ['default'],
	'/network/[name]/block/[blockNumber]/transaction/[transactionId]': ['default'],
	'/network/[name]/transaction/[transactionId]': ['default'],
}

const seedSessions = async (page: Page, rows: SessionRow[]) => {
	const payload = buildLocalStoragePayload(rows, (row) => row.id)
	await seedLocalStorageCollectionViaPage(
		page,
		coverageBaseURL,
		'transaction-sessions',
		payload,
	)
}

export const coverageScenarios: CoverageScenario[] = [
	{
		route: '/',
		branch: 'default',
		path: '/',
		assert: async (page) => {
			await expect(
				page.getByRole('heading', { name: APP_NAME, level: 1, }),
			).toBeVisible()
			await expect(
				page.getByRole('link', { name: 'Bridge', }).first(),
			).toBeVisible()
			await expect(
				page.getByRole('link', { name: 'Transfer', }).first(),
			).toBeVisible()
			await expect(
				page.getByRole('link', { name: 'About', }).first(),
			).toBeVisible()
		},
	},
	{
		route: '/about',
		branch: 'default',
		path: '/about',
		assert: async (page) => {
			await expect(page.getByRole('heading', { name: 'About', })).toBeVisible()
			await expect(page.getByRole('heading', { name: 'Legend', })).toBeVisible()
		},
	},
	{
		route: '/about-old',
		branch: 'default',
		path: '/about-old',
		assert: async (page) => {
			await expect(page.getByRole('heading', { name: 'About', })).toBeVisible()
			await expect(
				page.getByRole('heading', { name: 'Architecture diagram', }),
			).toBeVisible()
		},
	},
	{
		route: '/about-old-2',
		branch: 'default',
		path: '/about-old-2',
		assert: async (page) => {
			await expect(page.getByRole('heading', { name: 'About', })).toBeVisible()
			await expect(
				page.getByRole('heading', { name: 'Architecture diagram', }),
			).toBeVisible()
		},
	},
	{
		route: '/dashboard',
		branch: 'default',
		path: '/dashboard',
		assert: async (page) => {
			await expect(page.locator('#main').first()).toBeVisible()
			await expect(
				page.getByRole('button', { name: 'Split →', }).first(),
			).toBeVisible()
		},
	},
	{
		route: '/accounts',
		branch: 'default',
		path: '/accounts',
		assert: async (page) => {
			await expect(
				page.getByRole('heading', { name: 'Accounts', }),
			).toBeVisible()
			await expect(page.locator('[data-wallet-connect-trigger]')).toBeAttached()
		},
	},
	{
		route: '/peers',
		branch: 'default',
		path: '/peers',
		assert: async (page) => {
			await expect(page.getByRole('heading', { name: 'Peers', })).toBeVisible()
		},
	},
	{
		route: '/sessions',
		branch: 'empty',
		path: '/sessions',
		assert: async (page) => {
			await expect(
				page.getByRole('heading', { name: 'Sessions', }),
			).toBeVisible()
			await expect(page.getByText('No sessions yet.')).toBeVisible()
		},
	},
	{
		route: '/sessions',
		branch: 'populated',
		path: '/sessions',
		setup: async (_context, page) => {
			await seedSessions(page, [
				buildSessionRow({ id: 'session-list-1', actions: [ActionType.Bridge] }),
			])
		},
		assert: async (page) => {
			await expect(
				page.getByRole('heading', { name: 'Sessions', }),
			).toBeVisible()
			await expect(
				page.getByRole('link', { name: 'Bridge sessio', exact: true, }),
			).toBeVisible()
			await expect(
				page.getByRole('button', { name: 'Delete session', }).first(),
			).toBeVisible()
		},
	},
	{
		route: '/session',
		branch: 'swap',
		path: '/session#/Swap',
		assert: async (page) => {
			await expect(
				page.getByRole('heading', { name: 'Swap', level: 1 }),
			).toBeVisible()
		},
	},
	{
		route: '/session',
		branch: 'bridge',
		path: '/session#/Bridge',
		assert: async (page) => {
			await expect(
				page.getByRole('heading', { name: 'USDC Bridge', level: 1, }),
			).toBeVisible()
		},
	},
	{
		route: '/session',
		branch: 'transfer',
		path: '/session#/Transfer',
		assert: async (page) => {
			await expect(
				page.getByRole('heading', { name: 'Transfer', level: 1, }),
			).toBeVisible()
		},
	},
	{
		route: '/session',
		branch: 'liquidity',
		path: '/session#/liquidity',
		assert: async (page) => {
			await expect(
				page.getByRole('heading', { name: 'Liquidity', level: 1, }),
			).toBeVisible()
		},
	},
	{
		route: '/session',
		branch: 'createChannel',
		path: '/session#/createChannel',
		assert: async (page) => {
			await expect(
				page.getByRole('heading', { name: 'Create Channel', level: 1 }),
			).toBeVisible()
		},
	},
	{
		route: '/session',
		branch: 'addChannelMember',
		path: '/session#/addChannelMember',
		assert: async (page) => {
			await expect(
				page.getByRole('heading', { name: 'Add Member', level: 1 }),
			).toBeVisible()
		},
	},
	{
		route: '/session',
		branch: 'closeChannel',
		path: '/session#/closeChannel',
		assert: async (page) => {
			await expect(
				page.getByRole('heading', { name: 'Close Channel', level: 1 }),
			).toBeVisible()
		},
	},
	{
		route: '/session',
		branch: 'addLiquidity',
		path: '/session#/addLiquidity',
		assert: async (page) => {
			await expect(
				page.getByRole('heading', { level: 1 }).first(),
			).toBeVisible()
		},
	},
	{
		route: '/session',
		branch: 'removeLiquidity',
		path: '/session#/removeLiquidity',
		assert: async (page) => {
			await expect(
				page.getByRole('heading', { level: 1 }).first(),
			).toBeVisible()
		},
	},
	{
		route: '/session',
		branch: 'collectFees',
		path: '/session#/collectFees',
		assert: async (page) => {
			await expect(
				page.getByRole('heading', { level: 1 }).first(),
			).toBeVisible()
		},
	},
	{
		route: '/session',
		branch: 'increaseLiquidity',
		path: '/session#/increaseLiquidity',
		assert: async (page) => {
			await expect(
				page.getByRole('heading', { level: 1 }).first(),
			).toBeVisible()
		},
	},
	{
		route: '/session',
		branch: 'shareAddress',
		path: '/session#/shareAddress',
		assert: async (page) => {
			await expect(
				page.getByRole('heading', { name: 'Share Address', level: 1 }),
			).toBeVisible()
		},
	},
	{
		route: '/session',
		branch: 'proposeTransfer',
		path: '/session#/proposeTransfer',
		assert: async (page) => {
			await expect(
				page.getByRole('heading', { name: 'Propose Transfer', level: 1 }),
			).toBeVisible()
		},
	},
	{
		route: '/session',
		branch: 'requestVerification',
		path: '/session#/requestVerification',
		assert: async (page) => {
			await expect(
				page.getByRole('heading', { name: 'Request Verification', level: 1 }),
			).toBeVisible()
		},
	},
	{
		route: '/session',
		branch: 'unsupported',
		path: '/session#/intent',
		assert: async (page) => {
			await expect(page.getByRole('heading', { name: 'Session' })).toBeVisible()
			await expect(page.getByText('Unsupported session action.')).toBeVisible()
		},
	},
	{
		route: '/session/[id]',
		branch: 'not-found',
		path: '/session/unknown-session',
		assert: async (page) => {
			await expect(page.getByText('Session not found.')).toBeVisible()
			await expect(
				page.getByRole('link', { name: 'Back to sessions', }),
			).toBeVisible()
		},
	},
	{
		route: '/session/[id]',
		branch: 'redirect',
		path: '/session/session-redirect',
		setup: async (_context, page) => {
			await seedSessions(page, [
				buildSessionRow({ id: 'session-redirect', actions: [ActionType.Bridge] }),
			])
		},
		assert: async (page) => {
			await page.waitForURL(/\/session\/session-redirect/, { timeout: 10_000 })
		},
	},
	{
		route: '/rooms',
		branch: 'join-disabled',
		path: '/rooms',
		assert: async (page) => {
			const joinButton = page.getByRole('button', { name: 'Join', })
			await expect(joinButton).toBeDisabled()
		},
	},
	{
		route: '/rooms',
		branch: 'join-enabled',
		path: '/rooms',
		assert: async (page) => {
			const codeInput = page.getByLabel('Room code')
			await codeInput.fill('abcd')
			await expect(page.getByRole('button', { name: 'Join', })).toBeEnabled()
		},
	},
	{
		route: '/rooms/[roomId]',
		branch: 'share',
		path: '/rooms/abcd',
		assert: async (page) => {
			await expect(
				page.getByRole('heading', { name: 'Share', exact: true, }),
			).toBeVisible()
			await expect(page.locator('[data-room-share]')).toBeVisible()
		},
	},
	{
		route: '/rooms/[roomId]',
		branch: 'peers-empty',
		path: '/rooms/e2e0001',
		assert: async (page) => {
			await expect(
				page.getByText('No other peers in this room.'),
			).toBeVisible({ timeout: 15_000, })
		},
	},
	{
		route: '/rooms/[roomId]/channels',
		branch: 'default',
		path: '/rooms/abcd/channels',
		assert: async (page) => {
			await expect(
				page.getByRole('heading', { name: /Channels/i, }).first(),
			).toBeVisible()
			await expect(
				page.getByRole('link', { name: 'Back to room', }),
			).toBeVisible()
		},
	},
	{
		route: '/positions/channels',
		branch: 'default',
		path: '/positions/channels',
		assert: async (page) => {
			await expect(
				page.getByRole('heading', { name: 'Channels', }),
			).toBeVisible()
			await expect(page.getByText('Total:')).toBeVisible()
			await expect(page.getByLabel('Status')).toBeVisible()
		},
	},
	{
		route: '/positions/liquidity',
		branch: 'default',
		path: '/positions/liquidity',
		assert: async (page) => {
			await expect(
				page.getByRole('heading', { name: 'Liquidity', }),
			).toBeVisible()
		},
	},
	{
		route: '/test/collections',
		branch: 'default',
		path: '/test/collections',
		assert: async (page) => {
			await expect(
				page.getByRole('heading', { name: 'Test collections', }),
			).toBeVisible()
			await expect(
				page.getByRole('link', { name: 'Networks and coins' }),
			).toBeVisible()
		},
	},
	{
		route: '/test/networks-coins',
		branch: 'default',
		path: '/test/networks-coins',
		assert: async (page) => {
			await expect(
				page.getByRole('heading', { name: 'Networks and coins' }),
			).toBeVisible()
			await expect(
				page.getByRole('heading', { name: 'Networks', exact: true, }),
			).toBeVisible()
			await expect(
				page.getByRole('heading', { name: 'USDC coins' }),
			).toBeVisible()
		},
	},
	{
		route: '/test/intents',
		branch: 'default',
		path: '/test/intents',
		assert: async (page) => {
			await expect(
				page.getByRole('heading', { name: 'Entity intents', }),
			).toBeVisible()
		},
	},
	{
		route: '/test/chain-id',
		branch: 'button-disabled',
		path: '/test/chain-id',
		assert: async (page) => {
			const button = page.getByRole('button', { name: 'Get chain ID', })
			await expect(button).toBeDisabled()
		},
	},
	{
		route: '/test/chain-id',
		branch: 'button-enabled',
		path: '/test/chain-id',
		assert: async (page) => {
			const input = page.getByPlaceholder('RPC URL (https://…)')
			await input.fill('https://example.com')
			const button = page.getByRole('button', { name: 'Get chain ID', })
			await expect(button).toBeEnabled()
		},
	},
	{
		route: '/account/[address]',
		branch: 'valid-address',
		path: '/account/0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
		assert: async (page) => {
			await expect(page.locator('[data-account-header]')).toBeVisible()
			await expect(
				page.getByRole('heading', { name: /^Balances/, }),
			).toBeVisible()
			await expect(
				page.getByRole('heading', { name: /^Transactions/, }),
			).toBeVisible()
			await expect(
				page.getByRole('heading', { name: /^Wallet connections/, }),
			).toBeVisible()
			await expect(
				page.getByRole('heading', { name: /^Room \/ peer connections/, }),
			).toBeVisible()
			await expect(
				page.getByRole('heading', { name: /^Liquidity positions/, }),
			).toBeVisible()
			await expect(
				page.getByRole('heading', { name: /^Channels/, }),
			).toBeVisible()
		},
	},
	{
		route: '/account/[address]',
		branch: 'invalid-address',
		path: '/account/not-an-address',
		assert: async (page) => {
			await expect(
				page.getByRole('heading', { name: 'Invalid address', }),
			).toBeVisible()
		},
	},
	{
		route: '/coin/[symbol]',
		branch: 'usdc',
		path: '/coin/USDC',
		assert: async (page) => {
			await expect(page.locator('#main').first()).toBeVisible()
		},
	},
	{
		route: '/coin/[symbol]',
		branch: 'eth',
		path: '/coin/ETH',
		assert: async (page) => {
			await expect(page.locator('#main').first()).toBeVisible()
		},
	},
	{
		route: '/coin/[symbol]',
		branch: 'not-found',
		path: '/coin/UNSUPPORTED',
		assert: async (page) => {
			await expect(page.getByText('Unsupported symbol')).toBeVisible()
		},
	},
	{
		route: '/transfers',
		branch: 'default',
		path: '/transfers',
		assert: async (page) => {
			await expect(
				page.getByRole('link', { name: 'Bridge', }).first(),
			).toBeVisible({ timeout: 5000, })
		},
	},
	{
		route: '/wallets',
		branch: 'default',
		path: '/wallets',
		assert: async (page) => {
			await expect(
				page.getByRole('link', { name: 'Bridge', }).first(),
			).toBeVisible({ timeout: 5000, })
		},
	},
	{
		route: '/network/[name]',
		branch: 'default',
		path: '/network/1',
		assert: async (page) => {
			await expect(page.locator('#main').first()).toBeVisible({ timeout: 15_000, })
		},
	},
	{
		route: '/network/[name]/block/[blockNumber]',
		branch: 'default',
		path: '/network/1/block/1',
		assert: async (page) => {
			await expect(page.locator('#main').first()).toBeVisible({ timeout: 15_000, })
		},
	},
	{
		route: '/network/[name]/block/[blockNumber]/transaction/[transactionId]',
		branch: 'default',
		path: '/network/1/block/1/transaction/0x0',
		assert: async (page) => {
			await expect(page.locator('#main').first()).toBeVisible({ timeout: 15_000, })
		},
	},
	{
		route: '/network/[name]/transaction/[transactionId]',
		branch: 'default',
		path: '/network/1/transaction/0x0',
		assert: async (page) => {
			await expect(page.locator('#main').first()).toBeVisible({ timeout: 15_000, })
		},
	},
]
