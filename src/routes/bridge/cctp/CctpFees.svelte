<script lang="ts">
	// Types/constants
	type FeeRow = { finalityThreshold: number; minimumFee: number }

	// Props
	let {
		fromDomain,
		toDomain,
		apiHost,
		fastBps = $bindable(null as number | null),
		standardBps = $bindable(null as number | null),
	}: {
		fromDomain: number | null
		toDomain: number | null
		apiHost: string
		fastBps?: number | null
		standardBps?: number | null
	} = $props()

	// State
	let feeRows = $state<FeeRow[] | null>(null)
	let feeError = $state<string | null>(null)
	let feeLoading = $state(false)

	// (Derived)
	const feeFastBps = $derived(
		feeRows?.find((row) => row.finalityThreshold === 1000)?.minimumFee ?? null,
	)
	const feeStandardBps = $derived(
		feeRows?.find((row) => row.finalityThreshold === 2000)?.minimumFee ?? null,
	)

	$effect(() => {
		const source = fromDomain
		const destination = toDomain
		if (source === null || destination === null) {
			feeRows = null
			fastBps = null
			standardBps = null
			return
		}
		let cancelled = false
		feeLoading = true
		feeError = null
		fetch(`${apiHost}/v2/burn/USDC/fees/${source}/${destination}`, {
			headers: { Accept: 'application/json' },
		})
			.then((res) =>
				res.ok
					? res.json()
					: Promise.reject(new Error(`Fee request failed (${res.status})`)),
			)
			.then((data) => {
				if (!cancelled) {
					feeRows = Array.isArray(data) ? data : null
					fastBps =
						feeRows?.find((row) => row.finalityThreshold === 1000)
							?.minimumFee ?? null
					standardBps =
						feeRows?.find((row) => row.finalityThreshold === 2000)
							?.minimumFee ?? null
				}
			})
			.catch((err: Error) => {
				if (!cancelled) feeError = err.message
			})
			.finally(() => {
				if (!cancelled) feeLoading = false
			})
		return () => {
			cancelled = true
		}
	})
</script>

<div data-column="gap-1">
	<strong>Fees</strong>
	{#if feeLoading}
		<small data-muted>Loading fees…</small>
	{:else if feeError}
		<small data-error>{feeError}</small>
	{:else if feeFastBps !== null || feeStandardBps !== null}
		<dl data-summary>
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
	[data-summary] {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 0.25em 1em;
		margin: 0;
	}

	[data-summary] dt,
	[data-summary] dd {
		margin: 0;
	}

	[data-summary] dt {
		opacity: 0.7;
	}
</style>
