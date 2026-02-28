<script lang="ts">
	// Types/constants
	import type { Network } from '$/constants/networks.ts'
	import { SvelteSet } from 'svelte/reactivity'


	// Props
	let { networks }: { networks: Network[] } = $props()

	// (Derived)
	const items = $derived(
		new SvelteSet(networks)
	)


	// Components
	import List from '$/components/List.svelte'
	import NetworkView from '$/views/network/Network.svelte'
	import { NetworkLayout } from '$/views/network/Network.svelte'
</script>


<List
	items={items}
	getKey={(network) => network.chainId}
	getSortValue={(network) => network.chainId}
	placeholderKeys={new Set()}
	data-column
>
	{#snippet Item({ key, item, isPlaceholder })}
		{#if isPlaceholder}
			<span data-placeholder>…</span>
		{:else if item}
			<NetworkView
				networkId={{ chainId: item.chainId }}
				network={item}
				layout={NetworkLayout.Summary}
			/>
		{/if}
	{/snippet}

	{#snippet Empty()}
		<p data-text="muted">No networks.</p>
	{/snippet}
</List>
