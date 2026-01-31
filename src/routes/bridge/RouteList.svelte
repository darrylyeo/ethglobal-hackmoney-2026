<script lang="ts">
	// Types/constants
	import type { NormalizedRoute } from '$/api/lifi'

	// Components
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
		<p data-route-loading>Finding best routes…</p>
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

	[data-route-loading],
	[data-route-empty] {
		font-size: 0.875em;
		opacity: 0.8;
	}
</style>
