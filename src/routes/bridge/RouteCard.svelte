<script lang="ts">
	// Types/constants
	import type { NormalizedRoute } from '$/api/lifi'

	// Functions
	import { formatTokenAmount } from '$/lib/format'

	// Props
	let {
		route,
		selected = false,
		onclick,
		onkeydown,
	}: {
		route: NormalizedRoute
		selected?: boolean
		onclick: () => void
		onkeydown?: (e: KeyboardEvent) => void
	} = $props()

	// (Derived)
	const bridgeNames = $derived(
		[...new Set(route.steps.map((s) => s.toolName))].join(' → '),
	)

	function formatDuration(seconds: number) {
		return (
			seconds < 60
				? `~${seconds}s`
				: seconds < 3600
					? `~${Math.ceil(seconds / 60)} min`
					: `~${Math.ceil(seconds / 3600)} hr`
		)
	}
</script>

<button
	type="button"
	role="option"
	aria-selected={selected}
	data-route-card
	data-selected={selected ? '' : undefined}
	{onclick}
	onkeydown={onkeydown}
>
	<div data-route-header>
		<span data-route-output>
			{formatTokenAmount(route.toAmount, 6)} USDC
		</span>
		{#if route.tags.includes('RECOMMENDED')}
			<span data-route-tag="best">Best</span>
		{:else if route.tags.includes('CHEAPEST')}
			<span data-route-tag="cheapest">Cheapest</span>
		{:else if route.tags.includes('FASTEST')}
			<span data-route-tag="fastest">Fastest</span>
		{/if}
	</div>

	<div data-route-details>
		<span data-route-bridge>{bridgeNames}</span>
		<span data-route-time>{formatDuration(route.estimatedDurationSeconds)}</span>
		<span data-route-gas>~${parseFloat(route.gasCostUsd).toFixed(2)} gas</span>
	</div>

	{#if route.steps.length > 1}
		<div data-route-steps>
			{route.steps.length} steps
		</div>
	{/if}
</button>

<style>
	[data-route-card] {
		display: flex;
		flex-direction: column;
		gap: 0.5em;
		padding: 1em;
		border: 1px solid var(--color-border);
		border-radius: 0.5em;
		background: var(--color-bg-card);
		cursor: pointer;
		text-align: left;
		transition: border-color 0.15s;
	}

	[data-route-card]:hover,
	[data-route-card]:focus-visible {
		border-color: var(--color-primary);
	}

	[data-route-card][data-selected] {
		border-color: var(--color-primary);
		background: var(--color-bg-card-selected, var(--color-bg-card));
	}

	[data-route-header] {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	[data-route-output] {
		font-size: 1.125em;
		font-weight: 600;
	}

	[data-route-tag] {
		font-size: 0.75em;
		padding: 0.25em 0.5em;
		border-radius: 0.25em;
		text-transform: uppercase;
	}

	[data-route-tag='best'] {
		background: var(--color-success-bg, #dcfce7);
		color: var(--color-success, #22c55e);
	}

	[data-route-tag='cheapest'] {
		background: var(--color-info-bg, #dbeafe);
		color: var(--color-info, #3b82f6);
	}

	[data-route-tag='fastest'] {
		background: var(--color-warning-bg, #fef3c7);
		color: var(--color-warning, #f59e0b);
	}

	[data-route-details] {
		display: flex;
		gap: 1em;
		font-size: 0.875em;
		opacity: 0.8;
	}

	[data-route-steps] {
		font-size: 0.75em;
		opacity: 0.6;
	}
</style>
