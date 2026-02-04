/**
 * Yellow state: Clearnode connection and channel/deposit sync.
 */

import { DataSource } from '$/constants/data-sources'
import { yellowDepositsCollection } from '$/collections/yellow-deposits'
import { yellowChannelsCollection } from '$/collections/yellow-channels'
import { yellowTransfersCollection } from '$/collections/yellow-transfers'
import type { YellowChannelRow } from '$/collections/yellow-channels'
import type { YellowTransferRow } from '$/collections/yellow-transfers'
import {
	connectClearnode,
	getAvailableBalance,
	type ClearnodeConnection,
} from '$/api/yellow'
import type { EIP1193Provider } from '$/lib/wallet'
import { decodeNitroRpc, type NitroRpcMessage } from '$/lib/nitro-rpc'
import { parseDecimalToSmallest } from '$/lib/format'

const pendingChannelRooms = new Map<string, string>()

export const tagChannelWithRoom = (channelId: string, roomId: string) => {
	pendingChannelRooms.set(channelId, roomId)
}

function upsertChannel(row: YellowChannelRow) {
	const pendingRoomId = pendingChannelRooms.get(row.id)
	if (pendingRoomId) pendingChannelRooms.delete(row.id)
	const existing = yellowChannelsCollection.state.get(row.id)
	if (existing && row.turnNum < existing.turnNum) return
	const roomId = row.roomId ?? pendingRoomId
	if (existing) {
		yellowChannelsCollection.update(row.id, (draft) => {
			Object.assign(draft, row)
			draft.$source = DataSource.Yellow
			if (roomId) draft.roomId = roomId
		})
	} else {
		yellowChannelsCollection.insert({
			...row,
			$source: DataSource.Yellow,
			...(roomId && { roomId }),
		})
	}
}

function normalizeChannelFromMessage(params: unknown): YellowChannelRow | null {
	if (!params || typeof params !== 'object') return null
	const p = params as Record<string, unknown>
	const id = typeof p.id === 'string' ? p.id : null
	const chainId = typeof p.chainId === 'number' ? p.chainId : 0
	const participant0 =
		typeof p.participant0 === 'string' && p.participant0.startsWith('0x')
			? (p.participant0 as `0x${string}`)
			: null
	const participant1 =
		typeof p.participant1 === 'string' && p.participant1.startsWith('0x')
			? (p.participant1 as `0x${string}`)
			: null
	const asset =
		typeof p.asset === 'string' && p.asset.startsWith('0x')
			? (p.asset as `0x${string}`)
			: null
	if (!id || !participant0 || !participant1 || !asset) return null
	return {
		id,
		$source: DataSource.Yellow,
		chainId,
		participant0,
		participant1,
		asset,
		totalDeposited: BigInt(String(p.totalDeposited ?? 0)),
		balance0: BigInt(String(p.balance0 ?? 0)),
		balance1: BigInt(String(p.balance1 ?? 0)),
		turnNum: Number(p.turnNum ?? 0),
		status: (typeof p.status === 'string'
			? p.status
			: 'pending') as YellowChannelRow['status'],
		roomId: typeof p.roomId === 'string' ? p.roomId : undefined,
		createdAt: Number(p.createdAt ?? 0),
		updatedAt: Number(p.updatedAt ?? 0),
	}
}

function normalizeTransferFromMessage(
	params: unknown,
): YellowTransferRow | null {
	if (!params || typeof params !== 'object') return null
	const p = params as Record<string, unknown>
	const id = typeof p.id === 'string' ? p.id : null
	const channelId = typeof p.channelId === 'string' ? p.channelId : null
	const from =
		typeof p.from === 'string' && p.from.startsWith('0x')
			? (p.from as `0x${string}`)
			: null
	const to =
		typeof p.to === 'string' && p.to.startsWith('0x')
			? (p.to as `0x${string}`)
			: null
	if (!id || !channelId || !from || !to) return null
	return {
		id,
		$source: DataSource.Yellow,
		channelId,
		from,
		to,
		amount: BigInt(String(p.amount ?? 0)),
		turnNum: Number(p.turnNum ?? 0),
		timestamp: Number(p.timestamp ?? 0),
		status: (typeof p.status === 'string'
			? p.status
			: 'pending') as YellowTransferRow['status'],
	}
}

function normalizeBalanceUpdate(params: unknown): {
	address: `0x${string}`
	availableBalance: bigint
	lockedBalance: bigint
} | null {
	if (!params || typeof params !== 'object') return null
	const p = params as Record<string, unknown>
	if ('balanceUpdates' in p && Array.isArray(p.balanceUpdates)) {
		const updates = p.balanceUpdates
			.filter((entry) => entry && typeof entry === 'object')
			.map((entry) => entry as { asset?: unknown; amount?: unknown })
		const usdc = updates.find(
			(entry) => String(entry.asset ?? '').toLowerCase() === 'usdc',
		)
		const amount = usdc ? String(usdc.amount ?? '0') : '0'
		if (!yellowState.address) return null
		return {
			address: yellowState.address,
			availableBalance: parseDecimalToSmallest(amount, 6),
			lockedBalance: 0n,
		}
	}
	const addressValue =
		typeof p.address === 'string' && p.address.startsWith('0x')
			? p.address
			: typeof p.wallet === 'string' && p.wallet.startsWith('0x')
				? p.wallet
				: typeof p.account_id === 'string' && p.account_id.startsWith('0x')
					? p.account_id
					: yellowState.address
	const address =
		addressValue && addressValue.startsWith('0x')
			? (addressValue as `0x${string}`)
			: null
	if (!address) return null
	const availableBalance = p.available_balance ?? p.availableBalance
	if (availableBalance === undefined || availableBalance === null) return null
	return {
		address,
		availableBalance: BigInt(String(availableBalance)),
		lockedBalance: BigInt(String(p.locked_balance ?? p.lockedBalance ?? 0)),
	}
}

function handleClearnodeMessage(msg: NitroRpcMessage) {
	const [, method, params] = msg
	if (method === 'channel_updated' || method === 'cu') {
		const ch = normalizeChannelFromMessage(params)
		if (ch) upsertChannel(ch)
	} else if (method === 'transfer_received' || method === 'tr') {
		const t = normalizeTransferFromMessage(params)
		if (t) yellowTransfersCollection.insert(t)
	} else if (method === 'bu') {
		const update = normalizeBalanceUpdate(params)
		if (update) {
			const depositId = `${yellowState.chainId}:${update.address.toLowerCase()}`
			const existing = yellowDepositsCollection.state.get(depositId)
			const now = Date.now()
			if (existing) {
				yellowDepositsCollection.update(depositId, (draft) => {
					draft.$source = DataSource.Yellow
					draft.availableBalance = update.availableBalance
					draft.lockedBalance = update.lockedBalance
					draft.lastUpdated = now
				})
			} else {
				yellowDepositsCollection.insert({
					id: depositId,
					$source: DataSource.Yellow,
					chainId: yellowState.chainId ?? 0,
					address: update.address,
					availableBalance: update.availableBalance,
					lockedBalance: update.lockedBalance,
					lastUpdated: now,
				})
			}
		}
	}
}

export type YellowState = {
	clearnodeConnection: ClearnodeConnection | null
	chainId: number | null
	address: `0x${string}` | null
}

export const yellowState = $state<YellowState>({
	clearnodeConnection: null,
	chainId: null,
	address: null,
})

export const connectToYellow = async (
	chainId: number,
	provider: EIP1193Provider,
	address: `0x${string}`,
) => {
	const connection = await connectClearnode({
		chainId,
		signer: provider,
		address,
	})
	connection.onMessage((msg) => {
		try {
			const parsed = typeof msg === 'string' ? decodeNitroRpc(msg) : null
			if (parsed) handleClearnodeMessage(parsed)
		} catch {
			// ignore
		}
	})
	yellowState.clearnodeConnection = connection
	yellowState.chainId = chainId
	yellowState.address = address

	const balance = await getAvailableBalance({
		clearnodeConnection: connection,
		address,
	})
	const depositId = `${chainId}:${address.toLowerCase()}`
	const existing = yellowDepositsCollection.state.get(depositId)
	const now = Date.now()
	if (existing) {
		yellowDepositsCollection.update(depositId, (draft) => {
			draft.$source = DataSource.Yellow
			draft.availableBalance = balance
			draft.lastUpdated = now
		})
	} else {
		yellowDepositsCollection.insert({
			id: depositId,
			$source: DataSource.Yellow,
			chainId,
			address,
			availableBalance: balance,
			lockedBalance: 0n,
			lastUpdated: now,
		})
	}
}

export const disconnectFromYellow = () => {
	yellowState.clearnodeConnection?.close()
	yellowState.clearnodeConnection = null
	yellowState.chainId = null
	yellowState.address = null
}
