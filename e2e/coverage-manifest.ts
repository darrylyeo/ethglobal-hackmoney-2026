import { expect, type BrowserContext, type Page } from '@playwright/test'
import { CollectionId } from '$/constants/collections.ts'
import { APP_NAME } from '$/constants/app.ts'
import { SelectorKind } from '$/data/SelectorSignature.ts'
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
	'/account/[address]': ['valid-address', 'invalid-address'],
	'/accounts': ['default'],
	'/actions': ['default'],
	'/agents': ['default'],
	'/agents/[nodeId]': ['default'],
	'/agents/new': ['default'],
	'/agents/registry': ['default'],
	'/agents/registry/[id]': ['default', 'invalid-id'],
	'/calldata-decoder': ['default', 'decode-transfer', 'data-param'],
	'/channels/yellow': ['default'],
	'/coin/[coinId]': ['usdc', 'eth', 'not-found'],
	'/coins': ['default'],
	'/explore/coin/[coinId]': ['default'],
	'/dashboard': ['default'],
	'/dashboard/[dashboardId]': ['default'],
	'/dashboards': ['default'],
	'/eips': ['default'],
	'/eips/[number]': ['default', 'not-found'],
	'/farcaster': ['default'],
	'/farcaster/accounts': ['default'],
	'/farcaster/cast/[fid]/[hash]': ['default', 'not-found'],
	'/farcaster/cast/[hash]': ['default', 'not-found'],
	'/farcaster/casts': ['default'],
	'/farcaster/channel/[channelId]': ['default', 'not-found'],
	'/farcaster/channels': ['default'],
	'/farcaster/session': ['createPost', 'replyToPost'],
	'/farcaster/session/[id]': ['default', 'not-found'],
	'/farcaster/sessions': ['default'],
	'/farcaster/user/[fid]': ['default', 'not-found'],
	'/farcaster/users': ['default'],
	'/network/[name]': ['default', 'not-found'],
	'/network/[name]/block/[blockNumber]': ['default', 'not-found'],
	'/network/[name]/block/[blockNumber]/transaction/[transactionId]': ['default', 'not-found'],
	'/network/[name]/contract/[address]': ['default', 'not-found'],
	'/network/[name]/contracts': ['default', 'not-found'],
	'/network/[name]/transaction/[transactionId]': ['default', 'not-found'],
	'/network/[chainId]/forks': ['default', 'not-found'],
	'/networks': ['default'],
	'/peers': ['default', 'empty'],
	'/positions/channels': ['default'],
	'/positions/liquidity': ['default'],
	'/rooms': ['join-disabled', 'join-enabled'],
	'/rooms/[roomId]': ['share', 'peers-empty'],
	'/rooms/[roomId]/channels': ['default'],
	'/session': ['swap', 'bridge', 'transfer', 'addLiquidity', 'createChannel', 'addChannelMember', 'closeChannel', 'removeLiquidity', 'collectFees', 'increaseLiquidity', 'shareAddress', 'proposeTransfer', 'requestVerification', 'unsupported'],
	'/session/[id]': ['not-found', 'redirect'],
	'/sessions': ['empty', 'populated'],
	'/settings/llm': ['default'],
	'/settings/profiles': ['default'],
	'/test/chain-id': ['button-disabled', 'button-enabled'],
	'/test/collections': ['default'],
	'/test/intents': ['default'],
	'/test/layout-panes': ['default'],
	'/test/networks-coins': ['default'],
	'/test/stork': ['default'],
	'/transfers': ['default'],
	'/wallets': ['default'],
}

const seedSessions = async (page: Page, rows: SessionRow[]) => {
	const payload = buildLocalStoragePayload(rows, (row) => row.id)
	await seedLocalStorageCollectionViaPage(
		page,
		coverageBaseURL,
		'Sessions',
		payload,
	)
}

export const coverageScenarios: CoverageScenario[] = [
	{
		route: '/',
		branch: 'default',
		path: '/',
		assert: async (page) => {
			await expect(page).toHaveURL(/\/$|\/dashboard\//, { timeout: 15_000 })
			await expect(page.locator('#main, main').first()).toBeVisible()
			await expect(
				page.getByRole('link', { name: 'Bridge', exact: true }).first(),
			).toBeVisible()
			await expect(
				page.getByRole('link', { name: 'Transfer', exact: true }).first(),
			).toBeVisible()
			await expect(
				page.getByRole('link', { name: new RegExp(APP_NAME) }).first(),
			).toBeVisible()
		},
	},
	{
		route: '/about',
		branch: 'default',
		path: '/about',
		assert: async (page) => {
			await expect(
				page.getByRole('heading', { name: 'About', }),
			).toBeVisible({ timeout: 15_000 })
			await expect(
				page.getByRole('heading', { name: 'Legend', }),
			).toBeVisible({ timeout: 15_000 })
		},
	},
	{
		route: '/actions',
		branch: 'default',
		path: '/actions',
		assert: async (page) => {
			await expect(page.locator('#main, main').first()).toBeVisible({ timeout: 15_000 })
		},
	},
	{
		route: '/agents',
		branch: 'default',
		path: '/agents',
		assert: async (page) => {
			await expect(page.locator('#main, main').first()).toBeVisible({ timeout: 15_000 })
		},
	},
	{
		route: '/agents/[nodeId]',
		branch: 'default',
		path: '/agents/some-node',
		assert: async (page) => {
			await expect(page.locator('#main, main').first()).toBeVisible({ timeout: 15_000 })
		},
	},
	{
		route: '/agents/new',
		branch: 'default',
		path: '/agents/new',
		assert: async (page) => {
			await expect(page.locator('#main, main').first()).toBeVisible({ timeout: 15_000 })
		},
	},
	{
		route: '/agents/registry',
		branch: 'default',
		path: '/agents/registry',
		assert: async (page) => {
			await expect(page.locator('#main, main').first()).toBeVisible({ timeout: 15_000 })
			await expect(
				page.getByRole('heading', { name: 'EIP-8004 agent registry', level: 1 }),
			).toBeVisible({ timeout: 15_000 })
		},
	},
	{
		route: '/agents/registry/[id]',
		branch: 'default',
		path: '/agents/registry/1%3A0x0000000000000000000000000000000000000000',
		assert: async (page) => {
			await expect(page.locator('#main, main').first()).toBeVisible({ timeout: 25_000 })
		},
	},
	{
		route: '/agents/registry/[id]',
		branch: 'invalid-id',
		path: '/agents/registry/not-valid-id',
		assert: async (page) => {
			await expect(
				page.getByRole('heading', { name: 'Invalid agent id', }),
			).toBeVisible({ timeout: 15_000 })
			await expect(
				page.getByText(/Could not parse agent id/),
			).toBeVisible()
		},
	},
	{
		route: '/calldata-decoder',
		branch: 'default',
		path: '/calldata-decoder',
		assert: async (page) => {
			await expect(
				page.getByRole('heading', { name: 'Calldata decoder', level: 1 }),
			).toBeVisible({ timeout: 15_000 })
			await expect(
				page.getByPlaceholder(/0xa9059cbb/),
			).toBeVisible()
		},
	},
	{
		route: '/calldata-decoder',
		branch: 'decode-transfer',
		path: '/calldata-decoder',
		setup: async (_context, page) => {
			const rows = [
				{
					$id: { kind: SelectorKind.Function, hex: '0xa9059cbb' as `0x${string}` },
					signatures: ['transfer(address,uint256)'],
				},
			]
			const payload = buildLocalStoragePayload(rows, (row) => `${row.$id.kind}:${row.$id.hex}`)
			await seedLocalStorageCollectionViaPage(
				page,
				coverageBaseURL,
				CollectionId.SelectorSignatures,
				payload,
			)
		},
		assert: async (page) => {
			await expect(
				page.getByRole('heading', { name: 'Calldata decoder', level: 1 }),
			).toBeVisible({ timeout: 15_000 })
			const transferCalldata =
				'0xa9059cbb0000000000000000000000007432f2e8c2e2e8c2e2e8c2e2e8c2e2e8c2e2e8c2000000000000000000000000000000000000000000000000000de0b6b3a7640000'
			await page.getByPlaceholder(/0xa9059cbb/).fill(transferCalldata)
			await expect(page.getByText('Decoded arguments')).toBeVisible({ timeout: 10_000 })
			await expect(page.getByText('transfer(', { exact: false })).toBeVisible()
		},
	},
	{
		route: '/calldata-decoder',
		branch: 'data-param',
		path: '/calldata-decoder?data=0xa9059cbb0000000000000000000000007432f2e8c2e2e8c2e2e8c2e2e8c2e2e8c2e2e8c2000000000000000000000000000000000000000000000000000de0b6b3a7640000',
		setup: async (_context, page) => {
			const rows = [
				{
					$id: { kind: SelectorKind.Function, hex: '0xa9059cbb' as `0x${string}` },
					signatures: ['transfer(address,uint256)'],
				},
			]
			const payload = buildLocalStoragePayload(rows, (row) => `${row.$id.kind}:${row.$id.hex}`)
			await seedLocalStorageCollectionViaPage(
				page,
				coverageBaseURL,
				CollectionId.SelectorSignatures,
				payload,
			)
		},
		assert: async (page) => {
			await expect(
				page.getByRole('heading', { name: 'Calldata decoder', level: 1 }),
			).toBeVisible({ timeout: 15_000 })
			await expect(page.getByText('Decoded arguments')).toBeVisible({ timeout: 10_000 })
			await expect(page.getByText('transfer(', { exact: false })).toBeVisible()
		},
	},
	{
		route: '/channels/yellow',
		branch: 'default',
		path: '/channels/yellow',
		assert: async (page) => {
			await expect(page).toHaveURL(/\/positions\/channels/, { timeout: 15_000 })
			await expect(
				page.getByRole('heading', { name: 'Channels', }),
			).toBeVisible({ timeout: 15_000 })
			await expect(page.getByText('Total:')).toBeVisible()
		},
	},
	{
		route: '/coins',
		branch: 'default',
		path: '/coins',
		assert: async (page) => {
			await expect(page.locator('#main, main').first()).toBeVisible({ timeout: 15_000 })
		},
	},
	{
		route: '/dashboards',
		branch: 'default',
		path: '/dashboards',
		assert: async (page) => {
			await expect(
				page.getByRole('heading', { name: 'Dashboards', level: 1 }),
			).toBeVisible({ timeout: 15_000 })
			await expect(
				page.getByRole('button', { name: 'New dashboard', }),
			).toBeVisible()
			await expect(
				page.getByRole('link', { name: 'Open default', }),
			).toBeVisible()
		},
	},
	{
		route: '/explore/coin/[coinId]',
		branch: 'default',
		path: '/explore/coin/USDC',
		assert: async (page) => {
			await expect(page).toHaveURL(/\/coin\/USDC/, { timeout: 15_000 })
			await expect(page.locator('#main, main').first()).toBeVisible()
		},
	},
	{
		route: '/eips',
		branch: 'default',
		path: '/eips',
		assert: async (page) => {
			await expect(
				page.getByRole('heading', { name: 'EIPs / ERCs', level: 1 }),
			).toBeVisible({ timeout: 15_000 })
		},
	},
	{
		route: '/eips/[number]',
		branch: 'default',
		path: '/eips/1',
		assert: async (page) => {
			await expect(page.locator('main').first()).toBeVisible({ timeout: 15_000 })
			await expect(
				page.getByText(/Invalid EIP\/ERC number/),
			).toBeHidden()
		},
	},
	{
		route: '/eips/[number]',
		branch: 'not-found',
		path: '/eips/not-a-number',
		assert: async (page) => {
			await expect(
				page.getByRole('heading', { name: 'Not found', level: 1 }),
			).toBeVisible({ timeout: 15_000 })
			await expect(
				page.getByText(/Invalid EIP\/ERC number/),
			).toBeVisible()
		},
	},
	{
		route: '/network/[chainId]/forks',
		branch: 'default',
		path: '/network/1/forks',
		assert: async (page) => {
			await expect(
				page.getByRole('heading', { name: 'Fork upgrades', level: 1 }),
			).toBeVisible({ timeout: 15_000 })
		},
	},
	{
		route: '/dashboard',
		branch: 'default',
		path: '/dashboard',
		assert: async (page) => {
			await expect(page).toHaveURL(/\/dashboard\//, { timeout: 15_000 })
			await expect(page.locator('#main, main').first()).toBeVisible()
		},
	},
	{
		route: '/dashboard/[dashboardId]',
		branch: 'default',
		path: '/dashboard/default',
		assert: async (page) => {
			await expect(page.locator('#main, main').first()).toBeVisible()
			await expect(
				page.getByRole('button', { name: /Split/ }).first(),
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
		route: '/peers',
		branch: 'empty',
		path: '/peers',
		assert: async (page) => {
			await expect(page.getByRole('heading', { name: 'Peers', })).toBeVisible({ timeout: 15_000 })
			await expect(
				page.getByText(/No verified peers\. Verify an address in a room to see them here\./),
			).toBeVisible({ timeout: 15_000 })
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
				buildSessionRow({ id: 'session-list-1', actions: [{ type: 'Bridge', params: {} }] }),
			])
		},
		assert: async (page) => {
			await expect(
				page.getByRole('heading', { name: 'Sessions', }),
			).toBeVisible()
			await expect(
				page.getByRole('link', { name: /Bridge/ }).first(),
			).toBeVisible()
			await expect(
				page.getByRole('button', { name: 'Delete session', }).first(),
			).toBeVisible()
		},
	},
	{
		route: '/session',
		branch: 'swap',
		path: '/session?template=Swap',
		assert: async (page) => {
			await expect(
				page.getByRole('heading', { name: 'Swap' }),
			).toBeVisible()
		},
	},
	{
		route: '/session',
		branch: 'bridge',
		path: '/session?template=Bridge',
		assert: async (page) => {
			await expect(page.locator('#main, main').first()).toBeVisible()
			await expect(
				page.getByText(/Parameters|Proposed Transaction|Bridge/).first(),
			).toBeVisible()
		},
	},
	{
		route: '/session',
		branch: 'transfer',
		path: '/session?template=Transfer',
		assert: async (page) => {
			await expect(
				page.getByRole('heading', { name: 'Transfer' }),
			).toBeVisible()
		},
	},
	{
		route: '/session',
		branch: 'createChannel',
		path: '/session?template=CreateChannel',
		assert: async (page) => {
			await expect(page.locator('#main, main').first()).toBeVisible()
			await expect(
				page.getByText(/Parameters|Proposed Transaction|Create Channel/).first(),
			).toBeVisible()
		},
	},
	{
		route: '/session',
		branch: 'addChannelMember',
		path: '/session?template=AddChannelMember',
		assert: async (page) => {
			await expect(page.locator('#main, main').first()).toBeVisible()
			await expect(
				page.getByText(/Parameters|Proposed Transaction|Add Member/).first(),
			).toBeVisible()
		},
	},
	{
		route: '/session',
		branch: 'closeChannel',
		path: '/session?template=CloseChannel',
		assert: async (page) => {
			await expect(page.locator('#main, main').first()).toBeVisible()
			await expect(
				page.getByText(/Parameters|Proposed Transaction|Close Channel/).first(),
			).toBeVisible()
		},
	},
	{
		route: '/session',
		branch: 'addLiquidity',
		path: '/session?template=AddLiquidity',
		assert: async (page) => {
			await expect(
				page.getByRole('heading', { level: 1 }).first(),
			).toBeVisible()
		},
	},
	{
		route: '/session',
		branch: 'removeLiquidity',
		path: '/session?template=RemoveLiquidity',
		assert: async (page) => {
			await expect(
				page.getByRole('heading', { level: 1 }).first(),
			).toBeVisible()
		},
	},
	{
		route: '/session',
		branch: 'collectFees',
		path: '/session?template=CollectFees',
		assert: async (page) => {
			await expect(
				page.getByRole('heading', { level: 1 }).first(),
			).toBeVisible()
		},
	},
	{
		route: '/session',
		branch: 'increaseLiquidity',
		path: '/session?template=IncreaseLiquidity',
		assert: async (page) => {
			await expect(
				page.getByRole('heading', { level: 1 }).first(),
			).toBeVisible()
		},
	},
	{
		route: '/session',
		branch: 'shareAddress',
		path: '/session?template=ShareAddress',
		assert: async (page) => {
			await expect(page.locator('#main, main').first()).toBeVisible()
			await expect(
				page.getByText(/Parameters|Proposed Transaction|Share Address/).first(),
			).toBeVisible()
		},
	},
	{
		route: '/session',
		branch: 'proposeTransfer',
		path: '/session?template=ProposeTransfer',
		assert: async (page) => {
			await expect(page.locator('#main, main').first()).toBeVisible()
			await expect(
				page.getByText(/Parameters|Proposed Transaction|Propose Transfer/).first(),
			).toBeVisible()
		},
	},
	{
		route: '/session',
		branch: 'requestVerification',
		path: '/session?template=RequestVerification',
		assert: async (page) => {
			await expect(page.locator('#main, main').first()).toBeVisible()
			await expect(
				page.getByText(/Parameters|Proposed Transaction|Request Verification/).first(),
			).toBeVisible()
		},
	},
	{
		route: '/session',
		branch: 'unsupported',
		path: '/session?template=unknownAction',
		assert: async (page) => {
			await expect(
				page.getByRole('heading', { name: 'Swap' }),
			).toBeVisible()
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
				buildSessionRow({ id: 'session-redirect', actions: [{ type: 'Bridge', params: {} }] }),
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
			await expect(page.locator('#main, main').first()).toBeVisible()
			await expect(
				page.getByRole('link', { name: 'Room link' }),
			).toBeVisible()
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
			await expect(page.locator('#main, main').first()).toBeVisible({ timeout: 15_000 })
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
		route: '/coin/[coinId]',
		branch: 'usdc',
		path: '/coin/USDC',
		assert: async (page) => {
			await expect(page.locator('#main, main').first()).toBeVisible()
		},
	},
	{
		route: '/coin/[coinId]',
		branch: 'eth',
		path: '/coin/ETH',
		assert: async (page) => {
			await expect(page.locator('#main, main').first()).toBeVisible()
		},
	},
	{
		route: '/coin/[coinId]',
		branch: 'not-found',
		path: '/coin/UNSUPPORTED',
		assert: async (page) => {
			await expect(page.getByText(/Unsupported coin:/)).toBeVisible()
		},
	},
	{
		route: '/transfers',
		branch: 'default',
		path: '/transfers',
		assert: async (page) => {
			await expect(page).toHaveURL(/\/coin\/USDC/, { timeout: 15_000 })
			await expect(page.locator('#main, main').first()).toBeVisible()
		},
	},
	{
		route: '/wallets',
		branch: 'default',
		path: '/wallets',
		assert: async (page) => {
			await expect(page).toHaveURL(/\/accounts/, { timeout: 15_000 })
			await expect(
				page.getByRole('heading', { name: 'Accounts', }),
			).toBeVisible()
		},
	},
	{
		route: '/network/[name]',
		branch: 'default',
		path: '/network/1',
		assert: async (page) => {
			await expect(page.locator('#main, main').first()).toBeVisible({ timeout: 20_000 })
		},
	},
	{
		route: '/network/[name]',
		branch: 'not-found',
		path: '/network/unknown-network-xyz',
		assert: async (page) => {
			await expect(
				page.getByRole('heading', { name: 'Network not found', level: 1 }),
			).toBeVisible({ timeout: 15_000 })
			await expect(
				page.getByText(/could not be resolved/),
			).toBeVisible()
		},
	},
	{
		route: '/network/[name]/block/[blockNumber]',
		branch: 'default',
		path: '/network/1/block/1',
		assert: async (page) => {
			await expect(page.locator('#main, main').first()).toBeVisible({ timeout: 15_000, })
			await expect(
				page.getByRole('link', { name: 'Show Context', }),
			).toBeVisible({ timeout: 15_000, })
		},
	},
	{
		route: '/network/[name]/block/[blockNumber]',
		branch: 'not-found',
		path: '/network/1/block/abc',
		assert: async (page) => {
			await expect(
				page.getByRole('heading', { name: 'Not found', level: 1 }),
			).toBeVisible({ timeout: 15_000 })
			await expect(
				page.getByText(/Block number must be.*non-negative decimal integer/),
			).toBeVisible()
		},
	},
	{
		route: '/network/[name]/block/[blockNumber]/transaction/[transactionId]',
		branch: 'default',
		path: '/network/1/block/1/transaction/0x0000000000000000000000000000000000000000000000000000000000000000',
		assert: async (page) => {
			await expect(page.locator('#main, main').first()).toBeVisible({ timeout: 15_000, })
			await expect(
				page.getByRole('link', { name: 'Show Context', }),
			).toBeVisible({ timeout: 15_000, })
		},
	},
	{
		route: '/network/[name]/block/[blockNumber]/transaction/[transactionId]',
		branch: 'not-found',
		path: '/network/1/block/1/transaction/invalid-tx-hash',
		assert: async (page) => {
			await expect(
				page.getByRole('heading', { name: 'Not found', level: 1 }),
			).toBeVisible({ timeout: 15_000 })
			await expect(
				page.getByText(/Invalid transaction hash\./),
			).toBeVisible()
		},
	},
	{
		route: '/network/[name]/transaction/[transactionId]',
		branch: 'default',
		path: '/network/1/transaction/0x0000000000000000000000000000000000000000000000000000000000000000',
		assert: async (page) => {
			await expect(page.locator('#main, main').first()).toBeVisible({ timeout: 15_000, })
			await expect(
				page.getByRole('link', { name: 'Show Context', }),
			).toBeVisible({ timeout: 15_000, })
		},
	},
	{
		route: '/network/[name]/transaction/[transactionId]',
		branch: 'not-found',
		path: '/network/1/transaction/invalid-tx-hash',
		assert: async (page) => {
			await expect(
				page.getByRole('heading', { name: 'Not found', level: 1 }),
			).toBeVisible({ timeout: 15_000 })
			await expect(
				page.getByText(/Invalid transaction hash\./),
			).toBeVisible()
		},
	},
	{
		route: '/farcaster',
		branch: 'default',
		path: '/farcaster',
		assert: async (page) => {
			await expect(
				page.getByRole('heading', { name: 'Farcaster', level: 1 }),
			).toBeVisible({ timeout: 15_000 })
			await expect(page.getByText('Channels').first()).toBeAttached()
		},
	},
	{
		route: '/farcaster/session',
		branch: 'createPost',
		path: '/farcaster/session?template=CreatePost',
		assert: async (page) => {
			await expect(
				page.getByPlaceholder('Create post'),
			).toBeVisible({ timeout: 15_000 })
		},
	},
	{
		route: '/farcaster/session',
		branch: 'replyToPost',
		path: '/farcaster/session?template=ReplyToPost',
		assert: async (page) => {
			await expect(
				page.getByPlaceholder('Reply to post'),
			).toBeVisible({ timeout: 15_000 })
		},
	},
	{
		route: '/farcaster/sessions',
		branch: 'default',
		path: '/farcaster/sessions',
		assert: async (page) => {
			await expect(page.locator('main').first()).toBeVisible({ timeout: 15_000 })
		},
	},
	{
		route: '/farcaster/channel/[channelId]',
		branch: 'default',
		path: '/farcaster/channel/farcaster',
		assert: async (page) => {
			await expect(page.locator('main').first()).toBeVisible({ timeout: 15_000 })
		},
	},
	{
		route: '/farcaster/channel/[channelId]',
		branch: 'not-found',
		path: '/farcaster/channel/nonexistent-channel-xyz',
		assert: async (page) => {
			await expect(
				page.getByText(/Channel not found:/),
			).toBeVisible({ timeout: 20_000 })
		},
	},
	{
		route: '/farcaster/user/[fid]',
		branch: 'default',
		path: '/farcaster/user/3',
		assert: async (page) => {
			await expect(page.locator('main').first()).toBeVisible({ timeout: 15_000 })
		},
	},
	{
		route: '/farcaster/user/[fid]',
		branch: 'not-found',
		path: '/farcaster/user/999999999',
		assert: async (page) => {
			await expect(
				page.getByText(/User not found:/),
			).toBeVisible({ timeout: 20_000 })
		},
	},
	{
		route: '/farcaster/accounts',
		branch: 'default',
		path: '/farcaster/accounts',
		assert: async (page) => {
			await expect(page.locator('main').first()).toBeVisible({ timeout: 15_000 })
		},
	},
	{
		route: '/farcaster/cast/[fid]/[hash]',
		branch: 'default',
		path: '/farcaster/cast/3/0x0000000000000000000000000000000000000000',
		assert: async (page) => {
			await expect(page.locator('main').first()).toBeVisible({ timeout: 15_000 })
		},
	},
	{
		route: '/farcaster/cast/[fid]/[hash]',
		branch: 'not-found',
		path: '/farcaster/cast/3/0x0000000000000000000000000000000000000001',
		assert: async (page) => {
			await expect(
				page.getByText('Cast not found'),
			).toBeVisible({ timeout: 20_000 })
		},
	},
	{
		route: '/farcaster/cast/[hash]',
		branch: 'default',
		path: '/farcaster/cast/0x0000000000000000000000000000000000000000',
		assert: async (page) => {
			await expect(page.locator('main').first()).toBeVisible({ timeout: 15_000 })
		},
	},
	{
		route: '/farcaster/cast/[hash]',
		branch: 'not-found',
		path: '/farcaster/cast/0x0000000000000000000000000000000000000001',
		assert: async (page) => {
			await expect(
				page.getByText('Cast not found'),
			).toBeVisible({ timeout: 20_000 })
		},
	},
	{
		route: '/farcaster/channels',
		branch: 'default',
		path: '/farcaster/channels',
		assert: async (page) => {
			await expect(page.locator('main').first()).toBeVisible({ timeout: 15_000 })
		},
	},
	{
		route: '/farcaster/casts',
		branch: 'default',
		path: '/farcaster/casts',
		assert: async (page) => {
			await expect(page.locator('main').first()).toBeVisible({ timeout: 15_000 })
		},
	},
	{
		route: '/farcaster/session/[id]',
		branch: 'default',
		path: '/farcaster/session/some-id',
		assert: async (page) => {
			await expect(page.locator('main').first()).toBeVisible({ timeout: 15_000 })
		},
	},
	{
		route: '/farcaster/session/[id]',
		branch: 'not-found',
		path: '/farcaster/session/nonexistent-session-id',
		assert: async (page) => {
			await expect(
				page.getByText('Social post session not found.'),
			).toBeVisible({ timeout: 20_000 })
			await expect(
				page.getByRole('link', { name: 'New post' }),
			).toBeVisible()
		},
	},
	{
		route: '/farcaster/users',
		branch: 'default',
		path: '/farcaster/users',
		assert: async (page) => {
			await expect(page.locator('main').first()).toBeVisible({ timeout: 15_000 })
		},
	},
	{
		route: '/network/[name]/contract/[address]',
		branch: 'default',
		path: '/network/1/contract/0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
		assert: async (page) => {
			await expect(page.locator('#main, main').first()).toBeVisible({ timeout: 15_000 })
		},
	},
	{
		route: '/network/[name]/contract/[address]',
		branch: 'not-found',
		path: '/network/1/contract/not-an-address',
		assert: async (page) => {
			await expect(
				page.getByRole('heading', { name: 'Not found', level: 1 }),
			).toBeVisible({ timeout: 15_000 })
			await expect(
				page.getByText(/Invalid contract address\./),
			).toBeVisible()
		},
	},
	{
		route: '/network/[name]/contracts',
		branch: 'default',
		path: '/network/1/contracts',
		assert: async (page) => {
			await expect(page.locator('#main, main').first()).toBeVisible({ timeout: 15_000 })
		},
	},
	{
		route: '/network/[name]/contracts',
		branch: 'not-found',
		path: '/network/unknown-network-xyz/contracts',
		assert: async (page) => {
			await expect(
				page.getByRole('heading', { name: 'Not found', level: 1 }),
			).toBeVisible({ timeout: 15_000 })
			await expect(
				page.getByText(/could not be resolved/),
			).toBeVisible()
		},
	},
	{
		route: '/networks',
		branch: 'default',
		path: '/networks',
		assert: async (page) => {
			await expect(page.locator('#main, main').first()).toBeVisible({ timeout: 15_000 })
		},
	},
	{
		route: '/settings/llm',
		branch: 'default',
		path: '/settings/llm',
		assert: async (page) => {
			await expect(page.locator('#main, main').first()).toBeVisible({ timeout: 15_000 })
		},
	},
	{
		route: '/settings/profiles',
		branch: 'default',
		path: '/settings/profiles',
		assert: async (page) => {
			await expect(page.locator('#main, main').first()).toBeVisible({ timeout: 15_000 })
			await expect(
				page.getByRole('heading', { name: 'Profiles', level: 1 }),
			).toBeVisible()
			await expect(
				page.getByRole('button', { name: '+ New Profile', }),
			).toBeVisible()
		},
	},
	{
		route: '/test/layout-panes',
		branch: 'default',
		path: '/test/layout-panes',
		assert: async (page) => {
			await expect(page.locator('#main, main').first()).toBeVisible({ timeout: 15_000 })
		},
	},
	{
		route: '/test/stork',
		branch: 'default',
		path: '/test/stork',
		assert: async (page) => {
			await expect(page.locator('#main, main').first()).toBeVisible({ timeout: 15_000 })
		},
	},
]
