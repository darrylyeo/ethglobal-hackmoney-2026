<script lang="ts">
	// Types/constants
	import { DataSource } from '$/constants/data-sources.ts'


	// Context
	import { useLiveQuery, eq } from '@tanstack/svelte-db'
	import { cctpFeesCollection, fetchCctpFees } from '$/collections/CctpFees.ts'
	import { registerLocalLiveQueryStack } from '$/svelte/live-query-context.svelte.ts'


	// Props
	let {
		fromDomain,
		toDomain,
		apiHost,
		fastBps = $bindable(null as number | null),
		standardBps = $bindable(null as number | null),
	}: {
		fromDomain: number | null,
		toDomain: number | null,
		apiHost: string,
		fastBps?: number | null,
		standardBps?: number | null,
	} = $props()

	// (Derived) filter by source; then pick row matching apiHost/fromDomain/toDomain
	const feesQuery = useLiveQuery(
		(q) =>
			q
				.from({ row: cctpFeesCollection })
				.select(({ row }) => ({ row })),
		[() => apiHost, () => fromDomain, () => toDomain],
	)
	const liveQueryEntries = [
		{
			id: 'cctp-fees',
			label: 'CCTP Fees',
			query: feesQuery,
		},
	]
	registerLocalLiveQueryStack(() => liveQueryEntries)
	const feeRow = $derived(
		fromDomain !== null && toDomain !== null
			? ((feesQuery.data ?? []).find(
					(r) =>
						r.row.$id.apiHost === apiHost &&
						r.row.$id.fromDomain === fromDomain &&
						r.row.$id.toDomain === toDomain,
				)?.row ?? null)
			: null,
	)
	const feeRows = $derived(feeRow?.rows ?? null)
	const feeLoading = $derived(feeRow?.isLoading ?? false)
	const feeError = $derived(feeRow?.error ?? null)
	const feeFastBps = $derived(
		feeRows?.find((row) => row.finalityThreshold === 1000)?.minimumFee ?? null,
	)
	const feeStandardBps = $derived(
		feeRows?.find((row) => row.finalityThreshold === 2000)?.minimumFee ?? null,
	)


	// Actions
	$effect(() => {
		fastBps = feeFastBps
		standardBps = feeStandardBps
	})

	$effect(() => {
		const source = fromDomain
		const destination = toDomain
		if (source === null || destination === null) return
		fetchCctpFees({
			apiHost,
			fromDomain: source,
			toDomain: destination,
		}).catch(() => {})
	})
</script>


<div data-column="gap-1">
	<strong>Fees</strong>
	{#if feeLoading}
		<small data-muted>Loading fees…</small>
	{:else if feeError}
		<small data-error>{feeError}</small>
	{:else if feeFastBps !== null || feeStandardBps !== null}
		<dl class="fee-summary">
			<dt>Fast</dt>
			<dd>{feeFastBps ?? '—'} bps</dd>
			<dt>Standard</dt>
			<dd>{feeStandardBps ?? '—'} bps</dd>
		</dl>
	{:else}
		<small data-muted>Select a valid chain pair to load fees.</small>
	{/if}
</div>


<style>
	.fee-summary {
		margin: 0;
	}
</style>
