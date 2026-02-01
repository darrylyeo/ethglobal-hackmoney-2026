/**
 * Wallet connections collection: connected wallets with actors and chains.
 * Persisted to localStorage. Multiple wallets can be connected simultaneously.
 * Each connection tracks multiple actors (accounts) the wallet has exposed.
 * One connection can be "selected" at a time for use by the app.
 */

import { createCollection, localStorageCollectionOptions } from '@tanstack/svelte-db'
import { stringify, parse } from 'devalue'
import { type Wallet$id, getWallet } from '$/collections/wallets'
import { connectProvider, getWalletChainId } from '$/lib/wallet'

export type ConnectionStatus = 'connecting' | 'connected' | 'error'

export type WalletConnection$id = {
	wallet$id: Wallet$id
}

export type WalletConnectionRow = {
	$id: WalletConnection$id
	status: ConnectionStatus
	actors: `0x${string}`[]
	activeActor: `0x${string}` | null
	chainId: number | null
	selected: boolean
	error: string | null
	connectedAt: number
}

export const walletConnectionsCollection = createCollection(
	localStorageCollectionOptions({
		id: 'walletConnections',
		storageKey: 'wallet-connections',
		getKey: (row: WalletConnectionRow) => stringify(row.$id),
		parser: { stringify, parse },
	}),
)

export const getWalletConnection = ($id: WalletConnection$id) => (
	walletConnectionsCollection.state.get(stringify($id))
)

// Create a connection in "connecting" state
export const createConnection = (wallet$id: Wallet$id, autoSelect: boolean) => {
	const $id: WalletConnection$id = { wallet$id }
	const key = stringify($id)
	const existing = walletConnectionsCollection.state.get(key)
	if (!existing) {
		// If autoSelect, deselect all others first
		if (autoSelect) {
			for (const [k, conn] of walletConnectionsCollection.state) {
				if (conn.selected) {
					walletConnectionsCollection.update(k, (draft) => {
						draft.selected = false
					})
				}
			}
		}
		walletConnectionsCollection.insert({
			$id,
			status: 'connecting',
			actors: [],
			activeActor: null,
			chainId: null,
			selected: autoSelect,
			error: null,
			connectedAt: Date.now(),
		})
	}
}

// Update connection to connected state with actors
export const setConnectionConnected = (wallet$id: Wallet$id, actors: `0x${string}`[], chainId: number) => {
	const key = stringify({ wallet$id })
	const existing = walletConnectionsCollection.state.get(key)
	if (existing) {
		walletConnectionsCollection.update(key, (draft) => {
			draft.status = 'connected'
			draft.actors = actors
			draft.activeActor = actors[0] ?? null
			draft.chainId = chainId
			draft.error = null
		})
	}
}

// Update connection to error state
export const setConnectionError = (wallet$id: Wallet$id, error: string) => {
	const key = stringify({ wallet$id })
	const existing = walletConnectionsCollection.state.get(key)
	if (existing) {
		walletConnectionsCollection.update(key, (draft) => {
			draft.status = 'error'
			draft.error = error
		})
	}
}

// Update actors when wallet emits accountsChanged
export const updateConnectionActors = (wallet$id: Wallet$id, actors: `0x${string}`[]) => {
	const key = stringify({ wallet$id })
	const existing = walletConnectionsCollection.state.get(key)
	if (existing) {
		walletConnectionsCollection.update(key, (draft) => {
			draft.actors = actors
			if (!actors.includes(draft.activeActor!)) {
				draft.activeActor = actors[0] ?? null
			}
		})
	}
}

// Switch active actor for a connection
export const switchActiveActor = (wallet$id: Wallet$id, actor: `0x${string}`) => {
	const key = stringify({ wallet$id })
	const existing = walletConnectionsCollection.state.get(key)
	if (existing && existing.actors.includes(actor)) {
		walletConnectionsCollection.update(key, (draft) => {
			draft.activeActor = actor
		})
	}
}

// Select a connection (deselects all others)
export const selectConnection = (wallet$id: Wallet$id) => {
	const targetKey = stringify({ wallet$id })
	for (const [key, conn] of walletConnectionsCollection.state) {
		const shouldSelect = key === targetKey
		if (conn.selected !== shouldSelect) {
			walletConnectionsCollection.update(key, (draft) => {
				draft.selected = shouldSelect
			})
		}
	}
}

// Update chain
export const updateWalletChain = (wallet$id: Wallet$id, chainId: number) => {
	const key = stringify({ wallet$id })
	const existing = walletConnectionsCollection.state.get(key)
	if (existing) {
		walletConnectionsCollection.update(key, (draft) => {
			draft.chainId = chainId
		})
	}
}

// Disconnect (remove from collection)
export const disconnectWallet = (wallet$id: Wallet$id) => {
	const key = stringify({ wallet$id })
	const existing = walletConnectionsCollection.state.get(key)
	if (existing) {
		walletConnectionsCollection.delete(key)
	}
}

export const disconnectAllWallets = () => {
	for (const [key] of walletConnectionsCollection.state) {
		walletConnectionsCollection.delete(key)
	}
}

// Request wallet connection via RPC (user-initiated)
export const requestWalletConnection = async (wallet$id: Wallet$id, autoSelect = true) => {
	const walletRow = getWallet(wallet$id)
	if (!walletRow) throw new Error('Wallet not found')

	// Create connection in connecting state
	createConnection(wallet$id, autoSelect)

	try {
		const actor = await connectProvider({
			info: { uuid: walletRow.$id.rdns, name: walletRow.name, icon: walletRow.icon, rdns: walletRow.rdns },
			provider: walletRow.provider,
		})
		const chainId = await getWalletChainId(walletRow.provider)
		setConnectionConnected(wallet$id, [actor], chainId)
		return { actors: [actor], chainId }
	} catch (e) {
		setConnectionError(wallet$id, e instanceof Error ? e.message : String(e))
		throw e
	}
}

// Attempt to reconnect a persisted connection (auto-reconnect on page load)
export const reconnectWallet = async (wallet$id: Wallet$id) => {
	const walletRow = getWallet(wallet$id)
	if (!walletRow) return false

	const key = stringify({ wallet$id })
	const existing = walletConnectionsCollection.state.get(key)
	if (!existing) return false

	// Set to connecting state
	walletConnectionsCollection.update(key, (draft) => {
		draft.status = 'connecting'
		draft.error = null
	})

	try {
		// Request accounts (will prompt if not already authorized, or return silently if authorized)
		const accounts = await walletRow.provider.request({ method: 'eth_accounts' }) as string[]
		if (accounts.length === 0) {
			// Not authorized anymore - remove connection
			walletConnectionsCollection.delete(key)
			return false
		}

		const actors = accounts.filter((a) => a.startsWith('0x')) as `0x${string}`[]
		const chainId = await getWalletChainId(walletRow.provider)

		walletConnectionsCollection.update(key, (draft) => {
			draft.status = 'connected'
			draft.actors = actors
			// Keep activeActor if still in list, otherwise use first
			if (!actors.includes(draft.activeActor!)) {
				draft.activeActor = actors[0] ?? null
			}
			draft.chainId = chainId
			draft.error = null
		})
		return true
	} catch (e) {
		// Failed to reconnect - remove connection
		walletConnectionsCollection.delete(key)
		return false
	}
}
