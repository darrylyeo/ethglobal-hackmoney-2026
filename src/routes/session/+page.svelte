<script lang="ts">
	// Context
	import { setContext } from 'svelte'
	import { useLiveQuery, eq } from '@tanstack/svelte-db'

	// Functions
	import {
		getEffectiveHash,
		setEffectiveHash,
		SESSION_HASH_SOURCE_KEY,
		type SessionHashSource,
	} from '$/lib/dashboard-panel-hash'
	import { getTransactionSession, parseSessionHash } from '$/lib/transaction-sessions'

	// State
	import { transactionSessionsCollection } from '$/collections/transaction-sessions'

	// Props
	let {
		data = {},
		panelHash,
		setPanelHash,
	}: {
		data?: Record<string, unknown>
		panelHash?: string | null
		setPanelHash?: (hash: string, replace?: boolean) => void
	} = $props()

	const hashSource = $state<SessionHashSource>({
		enabled: false,
		panelHash: null,
		setPanelHash: () => {},
	})
	$effect(() => {
		if (typeof setPanelHash === 'function') {
			hashSource.enabled = true
			hashSource.panelHash = panelHash ?? null
			hashSource.setPanelHash = setPanelHash
			return
		}
		hashSource.enabled = false
		hashSource.panelHash = null
		hashSource.setPanelHash = () => {}
	})
	const effectiveHash = $derived(getEffectiveHash(hashSource))
	setContext(SESSION_HASH_SOURCE_KEY, hashSource)

	let activeSessionId = $state<string | null>(null)
	let hashAction = $state<
		'swap' | 'bridge' | 'transfer' | 'liquidity' | 'intent' | null
	>(null)

	const sessionQuery = useLiveQuery(
		(q) =>
			q
				.from({ row: transactionSessionsCollection })
				.where(({ row }) => eq(row.id, activeSessionId ?? ''))
				.select(({ row }) => ({ row })),
		[() => activeSessionId],
	)
	const liveQueryEntries = [
		{
			id: 'session-page-session',
			label: 'Session',
			query: sessionQuery,
		},
	]
	const session = $derived(sessionQuery.data?.[0]?.row ?? null)
	const activeAction = $derived(session?.actions[0] ?? hashAction ?? 'swap')
	const pageTitle = $derived(
		activeAction === 'bridge'
			? 'USDC Bridge'
			: activeAction === 'transfer'
				? 'Transfer'
				: activeAction === 'swap'
					? 'Swap'
					: activeAction === 'liquidity'
						? 'Liquidity'
						: 'Session',
	)

	$effect(() => {
		const parsed = parseSessionHash(effectiveHash)
		if (parsed.kind === 'session') {
			activeSessionId = parsed.sessionId
			hashAction = getTransactionSession(parsed.sessionId)?.actions[0] ?? null
			return
		}
		if (parsed.kind === 'actions') {
			activeSessionId = null
			hashAction = parsed.actions[0]?.action ?? 'swap'
			return
		}
		if (parsed.kind === 'empty') {
			activeSessionId = null
			hashAction = 'swap'
			return
		}
		activeSessionId = null
		hashAction = null
	})
	$effect(() => {
		if (hashSource.enabled) return
		if (typeof window === 'undefined') return
		const handleHash = () => {
			const parsed = parseSessionHash(window.location.hash)
			if (parsed.kind === 'session') {
				activeSessionId = parsed.sessionId
				hashAction = getTransactionSession(parsed.sessionId)?.actions[0] ?? null
				return
			}
			if (parsed.kind === 'actions') {
				activeSessionId = null
				hashAction = parsed.actions[0]?.action ?? 'swap'
				return
			}
			activeSessionId = null
			hashAction = parsed.kind === 'empty' ? 'swap' : null
		}
		handleHash()
		window.addEventListener('hashchange', handleHash)
		return () => window.removeEventListener('hashchange', handleHash)
	})

	// Components
	import BridgeView from '$/view/bridge.svelte'
	import LiquidityView from '$/view/liquidity.svelte'
	import LiveQueryScope from '$/components/LiveQueryScope.svelte'
	import SwapView from '$/view/swap.svelte'
	import TransferView from '$/view/transfer.svelte'
</script>

<svelte:head>
	<title>{pageTitle} – USDC Tools</title>
</svelte:head>

<LiveQueryScope entries={liveQueryEntries}>
	{#if activeAction === 'swap'}
		<SwapView />
	{:else if activeAction === 'bridge'}
		<BridgeView />
	{:else if activeAction === 'transfer'}
		<TransferView />
	{:else if activeAction === 'liquidity'}
		<LiquidityView />
	{:else}
		<main id="main" data-column data-sticky-container>
			<section data-scroll-item data-column="gap-3">
				<h1>Session</h1>
				<p data-muted>Unsupported session action.</p>
			</section>
		</main>
	{/if}
</LiveQueryScope>
