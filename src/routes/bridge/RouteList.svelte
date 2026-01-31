<script lang="ts">
	// Types/constants
	import type { NormalizedRoute } from '$/api/lifi'

	// Functions
	import { formatTokenAmount } from '$/lib/format'

	// Components
	import Skeleton from '$/components/Skeleton.svelte'

	// Props
	let {
		routes,
		selectedId = $bindable<string | null>(null),
		loading = false,
	}: {
		routes: NormalizedRoute[]
		selectedId?: string | null
		loading?: boolean
	} = $props()

	// (Derived) – auto-select first route
	$effect(() => {
		if (routes.length > 0 && selectedId === null) {
			selectedId = routes[0].id
		}
	})

	function formatDuration(seconds: number) {
		return (
			seconds < 60
				? `~${seconds}s`
				: seconds < 3600
					? `~${Math.ceil(seconds / 60)} min`
					: `~${Math.ceil(seconds / 3600)} hr`
		)
	}

	function handleKeyDown(e: KeyboardEvent, index: number) {
		if (e.key === 'ArrowDown' && index < routes.length - 1) {
			selectedId = routes[index + 1].id
			e.preventDefault()
		} else if (e.key === 'ArrowUp' && index > 0) {
			selectedId = routes[index - 1].id
			e.preventDefault()
		}
	}
</script>

<div data-route-list data-column="gap-3" role="listbox" aria-label="Bridge routes">
	{#if loading}
		{#each Array(3) as _, i (i)}
			<div data-route-card-skeleton data-card="secondary" data-column="gap-2" data-loading>
				<div data-row="gap-2 align-center">
					<Skeleton width="120px" height="1.25em" />
					<Skeleton width="60px" height="1.5em" rounded="0.25em" />
				</div>
				<div data-row="wrap gap-2">
					<Skeleton width="100px" height="1em" />
					<Skeleton width="60px" height="1em" />
					<Skeleton width="80px" height="1em" />
				</div>
			</div>
		{/each}
	{:else if routes.length === 0}
		<p data-route-empty data-muted>No routes available for this transfer.</p>
	{:else}
		{#each routes as route, i (route.id)}
			{@const bridgeNames = [...new Set(route.steps.map((s) => s.toolName))].join(' → ')}
			{@const selected = selectedId === route.id}
			<button
				type="button"
				role="option"
				aria-selected={selected}
				data-route-card
				data-column="gap-2"
				data-selected={selected ? '' : undefined}
				onclick={() => {
					selectedId = route.id
				}}
				onkeydown={(e) => handleKeyDown(e, i)}
			>
				<div data-row="gap-2 align-center">
					<strong>{formatTokenAmount(route.toAmount, 6)} USDC</strong>
					{#if route.tags.includes('RECOMMENDED')}
						<span data-route-tag="best">Best</span>
					{:else if route.tags.includes('CHEAPEST')}
						<span data-route-tag="cheapest">Cheapest</span>
					{:else if route.tags.includes('FASTEST')}
						<span data-route-tag="fastest">Fastest</span>
					{/if}
				</div>

				<div data-row="gap-2" data-muted>
					<span>{bridgeNames}</span>
					<span>{formatDuration(route.estimatedDurationSeconds)}</span>
					<span>~${parseFloat(route.gasCostUsd).toFixed(2)} gas</span>
				</div>

				{#if route.steps.length > 1}
					<div data-muted>
						{route.steps.length} steps
					</div>
				{/if}
			</button>
		{/each}
	{/if}
</div>

<style>
	[data-route-card] {
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
</style>
