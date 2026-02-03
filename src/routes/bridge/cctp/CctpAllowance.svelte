<script lang="ts">
	// Types/constants
	import { DataSource } from '$/constants/data-sources'

	// Context
	import { useLiveQuery, eq } from '@tanstack/svelte-db'
	import {
		cctpAllowanceCollection,
		fetchCctpAllowance,
	} from '$/collections/cctp-allowance'

	// Props
	let {
		fastTransferSupported,
		apiHost,
	}: {
		fastTransferSupported: boolean
		apiHost: string
	} = $props()

	// (Derived) filter by source; then pick row matching apiHost
	const allowanceQuery = useLiveQuery(
		(q) =>
			q
				.from({ row: cctpAllowanceCollection })
				.where(({ row }) => eq(row.$source, DataSource.Cctp))
				.select(({ row }) => ({ row })),
		[() => apiHost],
	)
	const allowanceRow = $derived(
		(allowanceQuery.data ?? []).find((r) => r.row.$id.apiHost === apiHost)?.row ??
			null,
	)
	const allowance = $derived(
		fastTransferSupported && allowanceRow ?
			allowanceRow.allowance !== null && allowanceRow.lastUpdated !== null ?
				{
					value: allowanceRow.allowance,
					lastUpdated: allowanceRow.lastUpdated,
				}
			: null
		: null,
	)
	const allowanceError = $derived(
		fastTransferSupported ? allowanceRow?.error ?? null : null,
	)
	const allowanceLoading = $derived(
		fastTransferSupported ? allowanceRow?.isLoading ?? false : false,
	)

	// Actions
	$effect(() => {
		if (!fastTransferSupported) return
		fetchCctpAllowance({ apiHost }).catch(() => {})
	})
</script>

<div data-column="gap-1">
	<strong>Fast transfer allowance</strong>
	{#if !fastTransferSupported}
		<small data-muted>Not required for this source chain.</small>
	{:else if allowanceLoading}
		<small data-muted>Loading allowance…</small>
	{:else if allowanceError}
		<small data-error>{allowanceError}</small>
	{:else if allowance}
		<small data-muted
			>{allowance.value.toLocaleString()} USDC · Updated {allowance.lastUpdated}</small
		>
	{:else}
		<small data-muted>Allowance unavailable.</small>
	{/if}
</div>
