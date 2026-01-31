<script lang="ts">
	// Props
	let {
		expiresAt,
		onRefresh,
		isRefreshing = false,
	}: {
		expiresAt: number | null
		onRefresh: () => void
		isRefreshing?: boolean
	} = $props()

	let now = $state(Date.now())

	$effect(() => {
		if (expiresAt === null) return
		const interval = setInterval(() => {
			now = Date.now()
		}, 1000)
		return () => clearInterval(interval)
	})

	const remainingMs = $derived(expiresAt !== null ? expiresAt - now : null)
	const remainingSec = $derived(
		remainingMs !== null ? Math.max(0, Math.ceil(remainingMs / 1000)) : null,
	)
	const isExpired = $derived(remainingMs !== null && remainingMs <= 0)
	const isWarning = $derived(
		remainingMs !== null &&
			remainingMs > 0 &&
			remainingMs <= 15_000,
	)
</script>

{#if expiresAt !== null}
	<div
		data-quote-expiration
		data-expired={isExpired ? '' : undefined}
		data-warning={isWarning ? '' : undefined}
	>
		{#if isExpired}
			<span>Quote expired – refresh to continue</span>
		{:else}
			<span>Quote valid for {remainingSec}s</span>
		{/if}
		<button
			type="button"
			onclick={onRefresh}
			disabled={isRefreshing}
		>
			{isRefreshing ? 'Refreshing…' : 'Refresh'}
		</button>
	</div>
{/if}

<style>
	[data-quote-expiration] {
		display: flex;
		align-items: center;
		gap: 0.5em;
		font-size: 0.875em;
	}

	[data-quote-expiration][data-warning] {
		color: var(--color-warning, #f59e0b);
	}

	[data-quote-expiration][data-expired] {
		color: var(--color-error, #ef4444);
	}
</style>
