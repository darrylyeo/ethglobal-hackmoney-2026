<script lang="ts">


	// Context
	import { page } from '$app/state'
	import { setContext } from 'svelte'
	import { useLiveQuery, eq } from '@tanstack/svelte-db'
	import { registerLocalLiveQueryStack } from '$/svelte/live-query-context.svelte'


	// Props
	let {
		panelHash,
		setPanelHash,
	}: {
		panelHash?: string | null,
		setPanelHash?: (hash: string, replace?: boolean) => void,
	} = $props()


	// Functions
	import {
		SESSION_HASH_SOURCE_KEY,
		type SessionHashSource,
	} from '$/lib/session/panelHash.ts'
	import { specBySessionAction } from '$/lib/intents.ts'
	import { parseSessionHash } from '$/lib/session/sessions.ts'


	// State
	import { transactionSessionsCollection } from '$/collections/transaction-sessions.ts'

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
	setContext(SESSION_HASH_SOURCE_KEY, hashSource)


	// (Derived)
	const effectiveHash = $derived(
		hashSource.enabled ? (hashSource.panelHash ?? '') : page.url.hash,
	)
	const parsedHash = $derived(parseSessionHash(effectiveHash))
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
	registerLocalLiveQueryStack(() => liveQueryEntries)
	const session = $derived(sessionQuery.data?.[0]?.row ?? null)
	const activeAction = $derived(session?.actions[0] ?? hashAction ?? 'swap')
	const activeSpec = $derived(
		activeAction ? specBySessionAction[activeAction] ?? null : null,
	)
	const pageTitle = $derived(activeSpec?.label ?? 'Session')


	// Components
	import LocalGraphScene from '$/components/LocalGraphScene.svelte'
	import BridgeView from './Bridge.svelte'
	import LiquidityView from './Liquidity.svelte'
	import SwapView from './Swap.svelte'
	import TransferView from './Transfer.svelte'
</script>


<svelte:head>
	<title>{pageTitle} – USDC Tools</title>
</svelte:head>


<div
	data-column
	data-sticky-container
>
	{#if activeAction === 'swap'}
		<SwapView />
	{:else if activeAction === 'bridge'}
		<BridgeView />
	{:else if activeAction === 'transfer'}
		<TransferView />
	{:else if activeSpec?.category === 'liquidity' || activeAction === 'liquidity'}
		<LiquidityView />
	{:else if activeSpec}
		<main
			id="main"
			data-column
			data-sticky-container
		>
			<section
				data-scroll-item
				data-column="gap-3"
			>
				<h1>{activeSpec.label}</h1>
				<p data-muted>{activeSpec.category} action</p>
			</section>
		</main>
	{:else}
		<main
			id="main"
			data-column
			data-sticky-container
		>
			<section
				data-scroll-item
				data-column="gap-3"
			>
				<h1>Session</h1>
				<p data-muted>Unsupported session action.</p>
			</section>
		</main>
	{/if}
	<section
		data-scroll-item
	>
		<LocalGraphScene />
	</section>
</div>
