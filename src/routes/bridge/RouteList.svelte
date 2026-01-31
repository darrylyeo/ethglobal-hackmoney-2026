<script lang="ts">
	// Types/constants
	import type { NormalizedRoute } from '$/api/lifi'

	// Components
	import Skeleton from '$/components/Skeleton.svelte'
	import RouteCard from './RouteCard.svelte'

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

<div data-route-list role="listbox" aria-label="Bridge routes">
	{#if loading}
		{#each Array(3) as _, i (i)}
			<div data-route-card-skeleton>
				<div data-route-header>
					<Skeleton width="120px" height="1.25em" />
					<Skeleton width="60px" height="1.5em" rounded="0.25em" />
				</div>
				<div data-route-details>
					<Skeleton width="100px" height="1em" />
					<Skeleton width="60px" height="1em" />
					<Skeleton width="80px" height="1em" />
				</div>
			</div>
		{/each}
	{:else if routes.length === 0}
		<p data-route-empty>No routes available for this transfer.</p>
	{:else}
		{#each routes as route, i (route.id)}
			<RouteCard
				{route}
				selected={selectedId === route.id}
				onclick={() => {
					selectedId = route.id
				}}
				onkeydown={(e) => handleKeyDown(e, i)}
			/>
		{/each}
	{/if}
</div>

<style>
	[data-route-list] {
		display: flex;
		flex-direction: column;
		gap: 0.75em;
	}

	[data-route-card-skeleton] {
		display: flex;
		flex-direction: column;
		gap: 0.5em;
		padding: 0.75em;
		background: var(--color-bg-page);
		border-radius: 0.5em;
		border: 1px solid var(--color-border);
	}

	[data-route-card-skeleton] [data-route-header] {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 0.5em;
	}

	[data-route-card-skeleton] [data-route-details] {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5em;
	}

	[data-route-empty] {
		font-size: 0.875em;
		opacity: 0.8;
	}
</style>
