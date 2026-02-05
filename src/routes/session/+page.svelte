<script lang="ts">
	// Context
	import { setContext } from 'svelte'
	import { useLiveQuery, eq } from '@tanstack/svelte-db'
	import { liveQueryLocalAttachmentFrom } from '$/svelte/live-query-context.svelte'

	// Functions
	import {
		getEffectiveHash,
		SESSION_HASH_SOURCE_KEY,
		type SessionHashSource,
	} from '$/lib/dashboard-panel-hash'
	import { parseSessionHash } from '$/lib/transaction-sessions'

	// State
	import { transactionSessionsCollection } from '$/collections/transaction-sessions'

	// Props
	let {
		panelHash,
		setPanelHash,
	}: {
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
	let localHash = $state('')
	const effectiveHash = $derived(
		hashSource.enabled ? (hashSource.panelHash ?? '') : localHash,
	)
	const parsedHash = $derived(parseSessionHash(effectiveHash))
	setContext(SESSION_HASH_SOURCE_KEY, hashSource)

	const activeSessionId = $derived(
		parsedHash.kind === 'session' ? parsedHash.sessionId : null,
	)
	const hashAction = $derived(
		parsedHash.kind === 'actions'
			? (parsedHash.actions[0]?.action ?? 'swap')
			: parsedHash.kind === 'empty'
				? 'swap'
				: null,
	)

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
	const liveQueryAttachment = liveQueryLocalAttachmentFrom(
		() => liveQueryEntries,
	)
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
		if (hashSource.enabled) return
		if (typeof window === 'undefined') return
		const updateHash = () => {
			localHash = window.location.hash
		}
		updateHash()
		window.addEventListener('hashchange', updateHash)
		return () => window.removeEventListener('hashchange', updateHash)
	})

	// Components
	import BridgeView from '$/view/bridge.svelte'
	import LiquidityView from '$/view/liquidity.svelte'
	import SwapView from '$/view/swap.svelte'
	import TransferView from '$/view/transfer.svelte'
</script>

<svelte:head>
	<title>{pageTitle} – USDC Tools</title>
</svelte:head>

<div style="display: contents" {@attach liveQueryAttachment}>
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
</div>
