<script lang="ts">
	// Props
	let {
		fastTransferSupported,
		apiHost,
	}: {
		fastTransferSupported: boolean
		apiHost: string
	} = $props()

	// State
	let allowance = $state<{ value: number; lastUpdated: string } | null>(null)
	let allowanceError = $state<string | null>(null)
	let allowanceLoading = $state(false)

	$effect(() => {
		if (!fastTransferSupported) {
			allowance = null
			return
		}
		let cancelled = false
		allowanceLoading = true
		allowanceError = null
		fetch(`${apiHost}/v2/fastBurn/USDC/allowance`, {
			headers: { Accept: 'application/json' },
		})
			.then((res) =>
				res.ok
					? res.json()
					: Promise.reject(
							new Error(`Allowance request failed (${res.status})`),
						),
			)
			.then((data) => {
				if (cancelled) return
				if (
					typeof data?.allowance === 'number' &&
					typeof data?.lastUpdated === 'string'
				) {
					allowance = { value: data.allowance, lastUpdated: data.lastUpdated }
				} else {
					allowance = null
				}
			})
			.catch((err: Error) => {
				if (!cancelled) allowanceError = err.message
			})
			.finally(() => {
				if (!cancelled) allowanceLoading = false
			})
		return () => {
			cancelled = true
		}
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
