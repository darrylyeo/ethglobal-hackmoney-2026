/**
 * Mock clearnode WebSocket server for e2e tests.
 * Simulates the Nitrolite RPC protocol without real auth verification.
 */

import { test as base, expect } from './profile.ts'
import { WebSocketServer, WebSocket } from 'ws'
import { createServer } from 'node:http'

const MOCK_CLEARNODE_ADDRESS = '0xCCCC000000000000000000000000000000000001' as const
const MOCK_CHANNEL_ID = '0xch00000000000000000000000000000000000000000000000000000000000001' as const

type MockClearnodeState = {
	channels: Map<string, {
		id: string
		participant0: string
		participant1: string
		asset: string
		balance0: bigint
		balance1: bigint
		turnNum: number
		status: string
	}>
	ledgerBalances: Map<string, { asset: string; amount: string }[]>
	transfers: { id: string; from: string; to: string; amount: string; turnNum: number }[]
	nextChannelIndex: number
}

export type MockClearnodeFixture = {
	wsUrl: string
	clearnodeAddress: `0x${string}`
	state: MockClearnodeState
	/** Set initial ledger balances before connecting */
	setBalance: (address: string, asset: string, amount: string) => void
}

const parseMessage = (data: string): { req?: unknown[]; sig?: string[] } | null => {
	try {
		return JSON.parse(data)
	} catch {
		return null
	}
}

const respond = (ws: WebSocket, requestId: number, method: string, params: unknown) => {
	ws.send(JSON.stringify({
		res: [requestId, method, params, Date.now()],
		sig: ['0x0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000'],
	}))
}

const notify = (ws: WebSocket, method: string, params: unknown) => {
	ws.send(JSON.stringify({
		res: [0, method, params, Date.now()],
	}))
}

function createMockClearnode(port: number): Promise<{
	wsUrl: string
	state: MockClearnodeState
	close: () => Promise<void>
}> {
	const state: MockClearnodeState = {
		channels: new Map(),
		ledgerBalances: new Map(),
		transfers: [],
		nextChannelIndex: 1,
	}

	return new Promise((resolve) => {
		const server = createServer()
		const wss = new WebSocketServer({ server })

		wss.on('connection', (ws) => {
			let authenticated = false
			let participantAddress: string | null = null

			ws.on('message', (raw) => {
				const data = raw.toString()
				const msg = parseMessage(data)
				if (!msg?.req || !Array.isArray(msg.req)) return

				const [requestId, method, params] = msg.req as [number, string, unknown]

				if (method === 'auth_request') {
					const p = params as Record<string, unknown> | undefined
					participantAddress = typeof p?.address === 'string' ? p.address : null
					respond(ws, requestId, 'auth_challenge', {
						challenge_message: 'mock-challenge-' + Date.now(),
					})
					return
				}

				if (method === 'auth_verify') {
					authenticated = true
					respond(ws, requestId, 'auth_verify', { success: true })

					// Send initial balance update
					if (participantAddress) {
						const balances = state.ledgerBalances.get(participantAddress.toLowerCase()) ?? [
							{ asset: 'usdc', amount: '100.0' },
						]
						notify(ws, 'bu', {
							balanceUpdates: balances,
						})
					}
					return
				}

				if (!authenticated) {
					respond(ws, requestId, 'error', { error: 'Not authenticated' })
					return
				}

				if (method === 'get_ledger_balances') {
					const p = params as Record<string, unknown> | undefined
					const addr = (typeof p?.participant === 'string' ? p.participant : participantAddress ?? '').toLowerCase()
					const balances = state.ledgerBalances.get(addr) ?? [
						{ asset: 'usdc', amount: '100.0' },
					]
					respond(ws, requestId, 'get_ledger_balances', { ledgerBalances: balances })
					return
				}

				if (method === 'create_channel') {
					const channelIndex = state.nextChannelIndex++
					const channelId = `0x${channelIndex.toString(16).padStart(64, '0')}`
					const p = params as Record<string, unknown> | undefined
					const token = typeof p?.token === 'string' ? p.token : '0x0000000000000000000000000000000000000000'
					const chainId = typeof p?.chain_id === 'number' ? p.chain_id : 1

					const channel = {
						id: channelId,
						participant0: participantAddress ?? '0x0',
						participant1: MOCK_CLEARNODE_ADDRESS,
						asset: token,
						balance0: 0n,
						balance1: 0n,
						turnNum: 0,
						status: 'active',
					}
					state.channels.set(channelId, channel)

					respond(ws, requestId, 'create_channel', { channel_id: channelId })

					// Notify channel update
					notify(ws, 'channel_updated', {
						id: channelId,
						chainId,
						participant0: channel.participant0,
						participant1: channel.participant1,
						asset: token,
						totalDeposited: '0',
						balance0: '0',
						balance1: '0',
						turnNum: 0,
						status: 'active',
						createdAt: Date.now(),
						updatedAt: Date.now(),
					})
					return
				}

				if (method === 'resize_channel') {
					const p = params as Record<string, unknown> | undefined
					const channelId = typeof p?.channel_id === 'string' ? p.channel_id : ''
					const channel = state.channels.get(channelId)
					if (!channel) {
						respond(ws, requestId, 'error', { error: 'Channel not found' })
						return
					}
					const resizeAmount = typeof p?.resize_amount === 'bigint' ? p.resize_amount : typeof p?.resize_amount === 'string' ? BigInt(p.resize_amount) : 0n
					channel.balance0 += resizeAmount
					channel.turnNum++
					respond(ws, requestId, 'resize_channel', { channel_id: channelId })
					return
				}

				if (method === 'transfer') {
					const p = params as Record<string, unknown> | undefined
					const destination = typeof p?.destination === 'string' ? p.destination : ''
					const allocations = Array.isArray(p?.allocations) ? p.allocations as { asset: string; amount: string }[] : []
					const transferId = `t-${Date.now()}-${state.transfers.length}`
					const turnNum = state.transfers.length + 1

					state.transfers.push({
						id: transferId,
						from: participantAddress ?? '0x0',
						to: destination,
						amount: allocations[0]?.amount ?? '0',
						turnNum,
					})

					respond(ws, requestId, 'transfer', { version: turnNum })

					// Notify balance update
					const currentBals = state.ledgerBalances.get((participantAddress ?? '').toLowerCase()) ?? [
						{ asset: 'usdc', amount: '100.0' },
					]
					const usdcBal = currentBals.find(b => b.asset === 'usdc')
					const sentAmount = parseFloat(allocations[0]?.amount ?? '0')
					if (usdcBal) {
						usdcBal.amount = (parseFloat(usdcBal.amount) - sentAmount).toFixed(1)
					}
					notify(ws, 'bu', { balanceUpdates: currentBals })
					return
				}

				if (method === 'close_channel') {
					const p = params as Record<string, unknown> | unknown
					const channelId = (
						Array.isArray(p) ? String(p[0] ?? '')
						: typeof p === 'object' && p !== null && 'channel_id' in p ? String((p as Record<string, unknown>).channel_id)
						: typeof p === 'string' ? p
						: ''
					)
					const channel = state.channels.get(channelId)
					if (channel) {
						channel.status = 'closed'
					}
					respond(ws, requestId, 'close_channel', { channel_id: channelId })

					if (channel) {
						notify(ws, 'channel_updated', {
							id: channelId,
							chainId: 1,
							participant0: channel.participant0,
							participant1: channel.participant1,
							asset: channel.asset,
							totalDeposited: '0',
							balance0: '0',
							balance1: '0',
							turnNum: channel.turnNum + 1,
							status: 'closed',
							createdAt: 0,
							updatedAt: Date.now(),
						})
					}
					return
				}

				// Fallback
				respond(ws, requestId, method, {})
			})
		})

		server.listen(port, () => {
			resolve({
				wsUrl: `ws://127.0.0.1:${port}`,
				state,
				close: () => new Promise<void>((res) => {
					wss.close()
					server.close(() => res())
				}),
			})
		})
	})
}

export const test = base.extend<{ mockClearnode: MockClearnodeFixture }>({
	mockClearnode: [
		async ({}, use, testInfo) => {
			const port = 9545 + testInfo.workerIndex
			const { wsUrl, state, close } = await createMockClearnode(port)

			const setBalance = (address: string, asset: string, amount: string) => {
				const key = address.toLowerCase()
				const existing = state.ledgerBalances.get(key) ?? []
				const entry = existing.find(b => b.asset === asset)
				if (entry) {
					entry.amount = amount
				} else {
					existing.push({ asset, amount })
					state.ledgerBalances.set(key, existing)
				}
			}

			await use({
				wsUrl,
				clearnodeAddress: MOCK_CLEARNODE_ADDRESS,
				state,
				setBalance,
			})

			await close()
		},
		{ scope: 'worker' },
	],
})

export { expect }
