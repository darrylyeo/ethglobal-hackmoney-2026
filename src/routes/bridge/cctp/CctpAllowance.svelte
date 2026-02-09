<script lang="ts">
	// Types/constants
	import { DataSource } from '$/constants/data-sources.ts'


	// Context
	import { useLiveQuery, eq } from '@tanstack/svelte-db'
	import {
		cctpAllowanceCollection,
		fetchCctpAllowance,
	} from '$/collections/CctpAllowance.ts'
	import { registerLocalLiveQueryStack } from '$/svelte/live-query-context.svelte.ts'


	// Props
	let {
		fastTransferSupported,
		apiHost,
	}: {
		fastTransferSupported: boolean,
		apiHost: string,
	} = $props()

	// (Derived) filter by source; then pick row matching apiHost
	const allowanceQuery = useLiveQuery(
		(q) =>
			q
				.from({ row: cctpAllowanceCollection })
				.select(({ row }) => ({ row })),
		[() => apiHost],
	)
	const liveQueryEntries = [
		{
			id: 'cctp-allowance',
			label: 'CCTP Allowance',
			query: allowanceQuery,
		},
	]
	registerLocalLiveQueryStack(() => liveQueryEntries)
	const allowanceRow = $derived(
		(allowanceQuery.data ?? []).find((r) => r.row.$id.apiHost === apiHost)
			?.row ?? null,
	)
	const allowance = $derived(
		fastTransferSupported && allowanceRow
			? allowanceRow.allowance !== null && allowanceRow.lastUpdated !== null
				? {
						value: allowanceRow.allowance,
						lastUpdated: allowanceRow.lastUpdated,
					}
				: null
			: null,
	)
	const allowanceError = $derived(
		fastTransferSupported ? (allowanceRow?.error ?? null) : null,
	)
	const allowanceLoading = $derived(
		fastTransferSupported ? (allowanceRow?.isLoading ?? false) : false,
	)


	// Actions
	$effect(() => {
		if (!fastTransferSupported) return
		fetchCctpAllowance({ apiHost }).catch(() => {})
	})
</script>


<div data-column="gap-2">
	<strong>Fast transfer allowance</strong>
	{#if !fastTransferSupported}
		<small data-text="muted">Not required for this source chain.</small>
	{:else if allowanceLoading}
		<small data-text="muted">Loading allowance…</small>
	{:else if allowanceError}
		<small data-error>{allowanceError}</small>
	{:else if allowance}
		<small data-text="muted"
			>{allowance.value.toLocaleString()} USDC · Updated {allowance.lastUpdated}</small
		>
	{:else}
		<small data-text="muted">Allowance unavailable.</small>
	{/if}
</div>
