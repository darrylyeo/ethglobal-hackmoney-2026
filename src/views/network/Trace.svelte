<script lang="ts">
	// Types/constants
	import type { ChainId } from '$/constants/networks.ts'
	import type { Trace as TraceType } from '$/data/Trace.ts'


	// Props
	let {
		trace,
		chainId,
	}: {
		trace: TraceType
		chainId: ChainId
	} = $props()


	// Functions
	function getKey(t: TraceType) {
		return `${t.index}-${t.from ?? ''}-${t.to ?? ''}-${(t.input ?? '').slice(0, 24)}`
	}


	// Components
	import TraceContent from '$/views/network/TraceContent.svelte'
	import Tree from '$/components/Tree.svelte'
</script>


<Tree
	items={[trace]}
	getKey={getKey}
	getChildren={(t) => t.children}
	getIsOpen={() => true}
	listTag="ul"
	listAttrs={{ 'data-column': '' }}
	detailsAttrs={{ 'data-card': '' }}
	summaryAttrs={{}}
>
	{#snippet Content({ node }: { node: TraceType })}
		<TraceContent trace={node} {chainId} />
	{/snippet}
</Tree>
