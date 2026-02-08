<script lang="ts">
	// Context
	import { useLocalQueries } from '$/svelte/live-query-context.svelte.ts'


	// Components
	import GraphScene from '$/routes/GraphScene.svelte'

	const localCtx = useLocalQueries()
	let open = $state(false)
</script>


<button
	type="button"
	class="local-graph-trigger"
	title={open ? 'Hide data graph' : 'Show data graph (this page)'}
	onclick={() => (open = !open)}
>
	{open ? '✕' : '◉'} Data graph
</button>
{#if open}
	<GraphScene
		isVisible={true}
		queryStack={localCtx.stack}
		globalQueryStack={[]}
	/>
{/if}


<style>
	.local-graph-trigger {
		appearance: none;
		background: none;
		border: none;
		font-size: 0.8125rem;
		opacity: 0.7;
		cursor: pointer;
		padding: 0.25rem 0;
	}
	.local-graph-trigger:hover {
		opacity: 1;
	}
</style>
