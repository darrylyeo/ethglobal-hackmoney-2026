/**
 * Yellow state: Clearnode connection and channel/deposit sync.
 */

import { yellowDepositsCollection } from '$/collections/yellow-deposits'
import { yellowChannelsCollection } from '$/collections/yellow-channels'
import { yellowTransfersCollection } from '$/collections/yellow-transfers'
import type { YellowChannel } from '$/collections/yellow-channels'
import type { YellowTransfer } from '$/collections/yellow-transfers'
import {
	connectClearnode,
	getAvailableBalance,
	type ClearnodeConnection,
} from '$/api/yellow'
import type { EIP1193Provider } from '$/lib/wallet'
import { decodeNitroRpc, type NitroRpcMessage } from '$/lib/nitro-rpc'
import { parseDecimalToSmallest } from '$/lib/format'

function upsertChannel(row: YellowChannel) {
	const existing = yellowChannelsCollection.state.get(row.id)
	if (existing && row.turnNum < existing.turnNum) return
	if (existing) {
		yellowChannelsCollection.update(row.id, (draft) => {
			Object.assign(draft, row)
		})
	} else {
		yellowChannelsCollection.insert(row)
	}
}

function normalizeChannelFromMessage(params: unknown): YellowChannel | null {
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
			: 'pending') as YellowChannel['status'],
		roomId: typeof p.roomId === 'string' ? p.roomId : undefined,
		createdAt: Number(p.createdAt ?? 0),
		updatedAt: Number(p.updatedAt ?? 0),
	}
}

function normalizeTransferFromMessage(params: unknown): YellowTransfer | null {
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
		channelId,
		from,
		to,
		amount: BigInt(String(p.amount ?? 0)),
		turnNum: Number(p.turnNum ?? 0),
		timestamp: Number(p.timestamp ?? 0),
		status: (typeof p.status === 'string'
			? p.status
			: 'pending') as YellowTransfer['status'],
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
					draft.availableBalance = update.availableBalance
					draft.lockedBalance = update.lockedBalance
					draft.lastUpdated = now
				})
			} else {
				yellowDepositsCollection.insert({
					id: depositId,
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
			draft.availableBalance = balance
			draft.lastUpdated = now
		})
	} else {
		yellowDepositsCollection.insert({
			id: depositId,
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
