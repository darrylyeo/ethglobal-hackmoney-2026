<script lang="ts" generics="Tab extends { id: string, label: string }">


	// Types/constants
	import type { Snippet } from 'svelte'


	// Props
	let {
		tabs,
		value = $bindable(''),
		content,
		...rootProps
	}: {
		tabs: Tab[]
		value?: string
		content: Snippet<[Tab]>
		[key: string]: unknown
	} = $props()


	// Components
	import { Tabs as BitsTabs } from 'bits-ui'
</script>


<BitsTabs.Root
	{...rootProps}
	bind:value
	data-tabs-root
>
	<BitsTabs.List data-tabs-list>
		{#each tabs as tab (tab.id)}
			<BitsTabs.Trigger value={tab.id} data-tabs-trigger>
				{tab.label}
			</BitsTabs.Trigger>
		{/each}
	</BitsTabs.List>
	{#each tabs as tab (tab.id)}
		<BitsTabs.Content value={tab.id} data-tabs-content>
			{@render content(tab)}
		</BitsTabs.Content>
	{/each}
</BitsTabs.Root>
