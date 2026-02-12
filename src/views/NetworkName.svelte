<script lang="ts">
	// Types/constants
	import { networkConfigsByChainId } from '$/constants/networks.ts'


	// Props
	let {
		chainId,
		showIcon = true,
		showChainId = false,
	}: {
		chainId: number
		showIcon?: boolean
		showChainId?: boolean
	} = $props()


	// (Derived)
	const config = $derived(networkConfigsByChainId[chainId])
	const name = $derived(config?.name ?? `Chain ${chainId}`)


	// Components
	import NetworkIcon from '$/views/NetworkIcon.svelte'
</script>

<span class="network-name" data-row="inline gap-2">
	{#if showIcon}
		<span class="icon" data-row="center">
			<NetworkIcon chainId={chainId} alt={name} />
		</span>
	{/if}
	<span class="label">{name}</span>
	{#if showChainId}
		<abbr class="chain-id" title="Chain ID">(Chain ID {chainId})</abbr>
	{/if}
</span>

<style>
	.label {
		font-variant-numeric: tabular-nums;
	}

	.chain-id {
		color: var(--text-secondary);
		font-size: smaller;
		text-decoration: none;
		cursor: help;
	}
</style>
