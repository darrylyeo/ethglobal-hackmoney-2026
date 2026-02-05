<script lang="ts">
	import type { Trace as TraceType } from '$/data/Trace'

	let { trace }: { trace: TraceType } = $props()
</script>


<details data-card="secondary radius-2 padding-2">
	<summary data-row="gap-2 align-center">
		<code>Trace #{trace.index}</code>
	</summary>
	{#if trace.children?.length}
		<ul data-column="gap-2">
			{#each trace.children as child (child.index)}
				<li id="trace:{trace.index}:{child.index}">
					<svelte:self trace={child} />
				</li>
			{/each}
		</ul>
	{/if}
</details>
