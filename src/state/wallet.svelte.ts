/**
 * Wallet subscriptions context.
 * Runs once at app root to:
 * 1. Subscribe to EIP-6963 → populate walletsCollection + auto-reconnect persisted connections
 * 2. Subscribe to chain/account changes → update walletConnectionsCollection
 *
 * Components query collections directly for data.
 */

// Context
import { useLiveQuery } from '@tanstack/svelte-db'
import { ConnectionStatus } from '$/data/WalletConnection.ts'


// Collections
import { upsertWallet, walletsCollection } from '$/collections/Wallets.ts'
import {
	reconnectWallet,
	requestWalletConnection,
	updateConnectionActors,
	updateWalletChain,
	walletConnectionsCollection,
} from '$/collections/WalletConnections.ts'


// Functions
import {
	ensureE2eProvider,
	getWalletChainId,
	subscribeAccountsChanged,
	subscribeChainChanged,
	subscribeProviders,
} from '$/lib/wallet.ts'
import { E2E_TEVM_PROVIDER_RDNS } from '$/tests/tevmConfig.ts'


// State
let walletSubscriptionsReady = false

const createWalletContext = () => {
	// Queries for subscription effects
	const walletsQuery = useLiveQuery((q) =>
		q.from({ wallet: walletsCollection }).select(({ wallet }) => ({ wallet })),
	)
	const connectionsQuery = useLiveQuery((q) =>
		q
			.from({ walletConnection: walletConnectionsCollection })
			.select(({ walletConnection }) => ({ walletConnection })),
	)

	// Track which wallets we've attempted to reconnect
	const reconnectAttempted = new Set<string>()
	const autoConnectAttempted = new Set<string>()

	$effect(() => {
		if (typeof window === 'undefined') return
		ensureE2eProvider()
		const e2eProvider = window.__E2E_TEVM_PROVIDER__
		if (
			!e2eProvider?.info?.rdns ||
			typeof e2eProvider.provider?.request !== 'function'
		)
			return
		upsertWallet({
			$id: { rdns: e2eProvider.info.rdns },
			name: e2eProvider.info.name ?? '',
			icon: e2eProvider.info.icon ?? '',
			rdns: e2eProvider.info.rdns ?? '',
			provider: e2eProvider.provider,
		})
		if (autoConnectAttempted.has(e2eProvider.info.rdns)) return
		autoConnectAttempted.add(e2eProvider.info.rdns)
		requestWalletConnection({ rdns: e2eProvider.info.rdns }, true)
	})

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
				upsertWallet({
					$id: { rdns },
					name: p.info.name ?? '',
					icon: p.info.icon ?? '',
					rdns: p.info.rdns ?? '',
					provider: p.provider,
				})
			}
			const connectionStates = Array.from(
				walletConnectionsCollection.state.values(),
			).filter((conn) => conn.$id?.wallet$id?.rdns)
			for (const conn of connectionStates) {
				const rdns = conn.$id.wallet$id.rdns
				if (!providerRdnsSet.has(rdns) || reconnectAttempted.has(rdns)) continue
				reconnectAttempted.add(rdns)
				reconnectWallet({ rdns })
			}
			const e2eProvider = providers.find(
				(p) => p.info.rdns === E2E_TEVM_PROVIDER_RDNS,
			)
			if (e2eProvider && !autoConnectAttempted.has(E2E_TEVM_PROVIDER_RDNS)) {
				autoConnectAttempted.add(E2E_TEVM_PROVIDER_RDNS)
				requestWalletConnection({ rdns: E2E_TEVM_PROVIDER_RDNS }, true)
			}
		})
	})

	// Subscribe to chain and account changes for all connected wallets
	const cleanups = new Map<string, () => void>()
	$effect(() => {
		const connections = (connectionsQuery.data ?? []).filter(
			(c) => c?.walletConnection?.$id?.wallet$id?.rdns,
		)
		const wallets = (walletsQuery.data ?? []).filter(
			(w) => w?.wallet?.$id?.rdns,
		)

		const connectedRdns = new Set(
			connections
				.filter(({ walletConnection: connection }) => connection.status === ConnectionStatus.Connected)
				.map(({ walletConnection: connection }) => connection.$id.wallet$id.rdns),
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
			if (conn.walletConnection.status !== 'connected') continue
			const rdns = conn.walletConnection.$id.wallet$id.rdns
			if (cleanups.has(rdns)) continue

			const walletEntry = wallets.find(({ wallet }) => wallet.$id.rdns === rdns)
			if (!walletEntry) continue

			// Get initial chain
			getWalletChainId(walletEntry.wallet.provider).then((chainId) => {
				if (chainId !== conn.walletConnection.chainId) {
					updateWalletChain({ rdns }, chainId)
				}
			})

			// Subscribe to chain changes
			const chainCleanup = subscribeChainChanged(
				walletEntry.wallet.provider,
				(chainId) => {
					updateWalletChain({ rdns }, chainId)
				},
			)

			// Subscribe to account changes
			const accountsCleanup = subscribeAccountsChanged(
				walletEntry.wallet.provider,
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

export const useWalletSubscriptions = () => {
	if (walletSubscriptionsReady) return
	walletSubscriptionsReady = true
	createWalletContext()
}
