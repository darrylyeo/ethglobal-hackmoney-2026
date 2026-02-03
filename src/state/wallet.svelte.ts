/**
 * Wallet subscriptions context.
 * Runs once at app root to:
 * 1. Subscribe to EIP-6963 → populate walletsCollection + auto-reconnect persisted connections
 * 2. Subscribe to chain/account changes → update walletConnectionsCollection
 *
 * Components query collections directly for data.
 */

// Context
import { useContext } from '$/svelte/useContext'
import { useLiveQuery, eq } from '@tanstack/svelte-db'
import { DataSource } from '$/constants/data-sources'

// Collections
import { walletsCollection, upsertWallet } from '$/collections/wallets'
import {
	walletConnectionsCollection,
	updateWalletChain,
	updateConnectionActors,
	reconnectWallet,
} from '$/collections/wallet-connections'

// Functions
import {
	subscribeProviders,
	getWalletChainId,
	subscribeChainChanged,
	subscribeAccountsChanged,
} from '$/lib/wallet'

export const WALLET_CONTEXT_KEY = 'wallet'

const createWalletContext = () => {
	// Queries for subscription effects
	const walletsQuery = useLiveQuery((q) =>
		q
			.from({ row: walletsCollection })
			.where(({ row }) => eq(row.$source, DataSource.Local))
			.select(({ row }) => ({ row })),
	)
	const connectionsQuery = useLiveQuery((q) =>
		q
			.from({ row: walletConnectionsCollection })
			.where(({ row }) => eq(row.$source, DataSource.Local))
			.select(({ row }) => ({ row })),
	)

	// Track which wallets we've attempted to reconnect
	const reconnectAttempted = new Set<string>()

	// Subscribe to EIP-6963 provider announcements → populate walletsCollection + auto-reconnect
	$effect(() => {
		if (typeof window === 'undefined') return
		return subscribeProviders((providers) => {
			const providerRdnsSet = new Set(
				providers
					.filter(
						(p) =>
							typeof p?.info?.rdns === 'string' &&
							p.info.rdns.length > 0 &&
							p.provider,
					)
					.map((p) => p.info.rdns),
			)
			for (const p of providers) {
				const rdns = p.info?.rdns
				if (typeof rdns !== 'string' || rdns.length === 0 || !p.provider)
					continue
				if (import.meta.env?.DEV) {
					console.debug('[EIP-6963] upsertWallet', rdns, p.info.name)
				}
				upsertWallet({
					$id: { rdns },
					name: p.info.name ?? '',
					icon: p.info.icon ?? '',
					rdns: p.info.rdns ?? '',
					provider: p.provider,
				})
			}
			const connections = (connectionsQuery.data ?? []).filter(
				(c) => c?.row?.$id?.wallet$id?.rdns,
			)
			for (const { row } of connections) {
				const rdns = row.$id.wallet$id.rdns
				if (!providerRdnsSet.has(rdns) || reconnectAttempted.has(rdns)) continue
				reconnectAttempted.add(rdns)
				reconnectWallet({ rdns })
			}
		})
	})

	// Subscribe to chain and account changes for all connected wallets
	const cleanups = new Map<string, () => void>()
	$effect(() => {
		const connections = (connectionsQuery.data ?? []).filter(
			(c) => c?.row?.$id?.wallet$id?.rdns,
		)
		const walletRows = (walletsQuery.data ?? []).filter(
			(w) => w?.row?.$id?.rdns,
		)

		const connectedRdns = new Set(
			connections
				.filter((c) => c.row.status === 'connected')
				.map((c) => c.row.$id.wallet$id.rdns),
		)

		// Clean up subscriptions for disconnected wallets
		for (const [rdns, cleanup] of cleanups) {
			if (!connectedRdns.has(rdns)) {
				cleanup()
				cleanups.delete(rdns)
			}
		}

		// Set up subscriptions for new connections
		for (const conn of connections) {
			if (conn.row.status !== 'connected') continue
			const rdns = conn.row.$id.wallet$id.rdns
			if (cleanups.has(rdns)) continue

			const walletRow = walletRows.find((w) => w.row.$id.rdns === rdns)
			if (!walletRow) continue

			// Get initial chain
			getWalletChainId(walletRow.row.provider).then((chainId) => {
				if (chainId !== conn.row.chainId) {
					updateWalletChain({ rdns }, chainId)
				}
			})

			// Subscribe to chain changes
			const chainCleanup = subscribeChainChanged(
				walletRow.row.provider,
				(chainId) => {
					updateWalletChain({ rdns }, chainId)
				},
			)

			// Subscribe to account changes
			const accountsCleanup = subscribeAccountsChanged(
				walletRow.row.provider,
				(actors) => {
					updateConnectionActors({ rdns }, actors)
				},
			)

			cleanups.set(rdns, () => {
				chainCleanup()
				accountsCleanup()
			})
		}

		return () => {
			for (const cleanup of cleanups.values()) cleanup()
			cleanups.clear()
		}
	})
}

export const useWalletSubscriptions = () =>
	useContext(WALLET_CONTEXT_KEY, createWalletContext)
