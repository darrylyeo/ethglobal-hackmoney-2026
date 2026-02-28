<script lang="ts">
	// Types/constants
	import type { Network$Id } from '$/data/Network.ts'
	import { networksByChainId } from '$/constants/networks.ts'


	// Props
	let {
		networkId: networkIdProp,
		chainId: chainIdProp,
		showIcon = true,
		showChainId = false,
	}: {
		networkId?: Network$Id
		chainId?: number
		showIcon?: boolean
		showChainId?: boolean
	} = $props()

	// (Derived)
	const chainId = $derived(
		networkIdProp?.chainId ?? chainIdProp ?? undefined
	)
	const name = $derived(
		chainId != null
			? (networksByChainId[chainId]?.name ?? `Chain ${chainId}`)
			: ''
	)


	// Components
	import NetworkIcon from '$/views/NetworkIcon.svelte'
</script>


<span class="network-name" data-row="inline gap-1">
	{#if showIcon && chainId != null}
		<span class="icon" data-row="center">
			<NetworkIcon
				networkId={networkIdProp ?? (chainId != null ? { chainId } : undefined)}
				alt={name}
			/>
		</span>
	{/if}

	<span class="label">{name}</span>
	{#if showChainId && chainId != null}
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
