/**
 * Wallet connections collection: connected wallets with actors and chains.
 * Persisted to localStorage. Multiple wallets can be connected simultaneously.
 * Each connection tracks multiple actors (accounts) the wallet has exposed.
 * One connection can be "selected" at a time for use by the app.
 */

import { CollectionId } from '$/constants/collections.ts'
import {
	createCollection,
	localStorageCollectionOptions,
} from '@tanstack/svelte-db'
import { stringify, parse } from 'devalue'
import { type WalletRow, getWallet } from '$/collections/Wallets.ts'
import type {
	ReadOnlyWallet,
	WalletConnection$Id,
	WalletConnectionEip1193,
	WalletConnectionNone,
} from '$/data/WalletConnection.ts'
import { WalletConnectionTransport } from '$/data/WalletConnection.ts'
import type { Wallet$Id } from '$/data/Wallet.ts'
import { normalizeAddress } from '$/lib/address.ts'
import { connectProvider, getWalletChainId } from '$/lib/wallet.ts'

export type WalletConnectionRow =
	| WalletConnectionEip1193
	| WalletConnectionNone

export type ReadOnlyWalletRow = ReadOnlyWallet

export type ConnectedWallet =
	| { wallet: WalletRow; connection: WalletConnectionEip1193 }
	| { wallet: ReadOnlyWalletRow; connection: WalletConnectionNone }

export const walletConnectionsCollection = createCollection(
	localStorageCollectionOptions({
		id: CollectionId.WalletConnections,
		storageKey: CollectionId.WalletConnections,
		getKey: (row: WalletConnectionRow) => stringify(row.$id),
		parser: { stringify, parse },
	}),
)

export const getWalletConnection = ($id: WalletConnection$Id) =>
	walletConnectionsCollection.state.get(stringify($id))

// Create a connection in "connecting" state
export const createConnection = (wallet$id: Wallet$Id, autoSelect: boolean) => {
	const $id: WalletConnection$Id = { wallet$id }
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
			transport: WalletConnectionTransport.Eip1193,
			status: ConnectionStatus.Connecting,
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
export const setConnectionConnected = (
	wallet$id: Wallet$Id,
	actors: `0x${string}`[],
	chainId: number,
) => {
	const key = stringify({ wallet$id })
	const existing = walletConnectionsCollection.state.get(key)
	if (existing) {
		walletConnectionsCollection.update(key, (draft) => {
			draft.transport = WalletConnectionTransport.Eip1193
			draft.status = ConnectionStatus.Connected
			draft.actors = actors
			draft.activeActor = actors[0] ?? null
			draft.chainId = chainId
			draft.error = null
		})
	}
}

// Update connection to error state
export const setConnectionError = (wallet$id: Wallet$Id, error: string) => {
	const key = stringify({ wallet$id })
	const existing = walletConnectionsCollection.state.get(key)
	if (existing) {
		walletConnectionsCollection.update(key, (draft) => {
			draft.transport = WalletConnectionTransport.Eip1193
			draft.status = ConnectionStatus.Error
			draft.error = error
		})
	}
}

// Update actors when wallet emits accountsChanged
export const updateConnectionActors = (
	wallet$id: Wallet$Id,
	actors: `0x${string}`[],
) => {
	const key = stringify({ wallet$id })
	const existing = walletConnectionsCollection.state.get(key)
	if (existing) {
		walletConnectionsCollection.update(key, (draft) => {
			draft.transport = WalletConnectionTransport.Eip1193
			draft.actors = actors
			if (!actors.includes(draft.activeActor!)) {
				draft.activeActor = actors[0] ?? null
			}
		})
	}
}

// Switch active actor for a connection
export const switchActiveActor = (
	wallet$id: Wallet$Id,
	actor: `0x${string}`,
) => {
	const key = stringify({ wallet$id })
	const existing = walletConnectionsCollection.state.get(key)
	if (existing && existing.actors.includes(actor)) {
		walletConnectionsCollection.update(key, (draft) => {
			draft.transport = WalletConnectionTransport.Eip1193
			draft.activeActor = actor
		})
	}
}

// Select a connection (deselects all others)
export const selectConnection = (wallet$id: Wallet$Id) => {
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

// Toggle one connection's selection (for multiselect)
export const toggleConnectionSelection = (wallet$id: Wallet$Id) => {
	const key = stringify({ wallet$id })
	const conn = walletConnectionsCollection.state.get(key)
	if (conn) {
		walletConnectionsCollection.update(key, (draft) => {
			draft.selected = !draft.selected
		})
	}
}

// Set which connections are selected by rdns (for multiselect)
export const setSelectedConnections = (rdnsSet: Set<string>) => {
	for (const [key, conn] of walletConnectionsCollection.state) {
		const rdns = conn.$id.wallet$id.rdns
		const shouldSelect = rdnsSet.has(rdns)
		if (conn.selected !== shouldSelect) {
			walletConnectionsCollection.update(key, (draft) => {
				draft.$source = DataSource.Local
				draft.selected = shouldSelect
			})
		}
	}
}

// Update chain
export const updateWalletChain = (wallet$id: Wallet$Id, chainId: number) => {
	const key = stringify({ wallet$id })
	const existing = walletConnectionsCollection.state.get(key)
	if (existing) {
		walletConnectionsCollection.update(key, (draft) => {
			draft.transport = WalletConnectionTransport.Eip1193
			draft.chainId = chainId
		})
	}
}

export const connectReadOnly = ({
	address,
	autoSelect = true,
}: {
	address: string
	autoSelect?: boolean
}) => {
	const normalized = normalizeAddress(address)
	if (!normalized) return false
	const wallet$id = { rdns: `readonly:${normalized}` }
	const key = stringify({ wallet$id })
	const existing = walletConnectionsCollection.state.get(key)
	if (autoSelect) {
		for (const [k, conn] of walletConnectionsCollection.state) {
			if (conn.selected) {
				walletConnectionsCollection.update(k, (draft) => {
					draft.selected = false
				})
			}
		}
	}
	if (existing) {
		walletConnectionsCollection.update(key, (draft) => {
			draft.transport = WalletConnectionTransport.None
			draft.status = ConnectionStatus.Connected
			draft.actors = [normalized]
			draft.activeActor = normalized
			draft.chainId = null
			draft.error = null
		})
		return true
	}
	walletConnectionsCollection.insert({
		$id: { wallet$id },
		transport: WalletConnectionTransport.None,
		status: ConnectionStatus.Connected,
		actors: [normalized],
		activeActor: normalized,
		chainId: null,
		selected: autoSelect,
		error: null,
		connectedAt: Date.now(),
	})
	return true
}

// Disconnect (remove from collection)
export const disconnectWallet = (wallet$id: Wallet$Id) => {
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
export const requestWalletConnection = async (
	wallet$id: Wallet$Id,
	autoSelect = true,
) => {
	const walletRow = getWallet(wallet$id)
	if (!walletRow) throw new Error('Wallet not found')

	// Create connection in connecting state
	createConnection(wallet$id, autoSelect)

	try {
		const actor = await connectProvider({
			info: {
				uuid: walletRow.$id.rdns,
				name: walletRow.name,
				icon: walletRow.icon,
				rdns: walletRow.rdns,
			},
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
export const reconnectWallet = async (wallet$id: Wallet$Id) => {
	const walletRow = getWallet(wallet$id)
	if (!walletRow) return false

	const key = stringify({ wallet$id })
	const existing = walletConnectionsCollection.state.get(key)
	if (!existing) return false

	// Set to connecting state
	walletConnectionsCollection.update(key, (draft) => {
		draft.transport = WalletConnectionTransport.Eip1193
		draft.status = ConnectionStatus.Connecting
		draft.error = null
	})

	try {
		// Request accounts (will prompt if not already authorized, or return silently if authorized)
		const accounts = (await walletRow.provider.request({
			method: 'eth_accounts',
		})) as string[]
		if (accounts.length === 0) {
			setConnectionError(wallet$id, 'Locked')
			return false
		}

		const actors = accounts.filter((a) => a.startsWith('0x')) as `0x${string}`[]
		const chainId = await getWalletChainId(walletRow.provider)

		walletConnectionsCollection.update(key, (draft) => {
			draft.transport = WalletConnectionTransport.Eip1193
			draft.status = ConnectionStatus.Connected
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
		setConnectionError(wallet$id, e instanceof Error ? e.message : String(e))
		return false
	}
}
