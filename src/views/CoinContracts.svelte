<script lang="ts">
	// Types/constants
	import type { Erc20Token } from '$/constants/coin-instances.ts'
	import { erc20InstancesByCoinId } from '$/constants/coin-instances.ts'
	import type { CoinId } from '$/constants/coins.ts'
	import { networksByChainId } from '$/constants/networks.ts'
	import { resolve } from '$app/paths'
	import { formatAddress } from '$/lib/address.ts'
	import Heading from '$/components/Heading.svelte'
	import CollapsibleList from '$/components/CollapsibleList.svelte'
	import Contract from '$/views/Contract.svelte'


	// Props
	let { coinId }: { coinId: CoinId } = $props()

	// (Derived)
	const tokensSet = $derived(
		new Set((erc20InstancesByCoinId.get(coinId) ?? []) as Erc20Token[]),
	)

	function getKey(t: Erc20Token): string {
		return `${t.$id.$network.chainId}:${t.$id.address}`
	}
	function getSortValue(t: Erc20Token): number | string {
		const network = networksByChainId[t.$id.$network.chainId]
		return network?.name ?? t.$id.$network.chainId
	}
</script>


{#snippet ContractsTitle({ countText })}
	<Heading>Contracts ({countText} chains)</Heading>
{/snippet}
<CollapsibleList
	title="Contracts"
	Title={ContractsTitle}
	detailsProps={{ open: true, 'data-card': '' }}
	loaded={tokensSet.size}
	items={tokensSet}
	getKey={getKey}
	getSortValue={getSortValue}
	placeholderKeys={new Set()}
	scrollPosition="Start"
>
	{#snippet Empty()}
		<p data-text="muted">No contracts.</p>
	{/snippet}

	{#snippet Item({ key, item, isPlaceholder })}
		<span id="contract:{key}">
			{#if isPlaceholder}
				<code>Contract (loading…)</code>
			{:else}
				{@const network = networksByChainId[item.$id.$network.chainId]}
				<Contract
					contractId={item.$id}
					idSerialized={`${item.$id.$network.chainId}:${item.$id.address}`}
					href={resolve(`/network/${item.$id.$network.chainId}/contract/${item.$id.address}`)}
					label={formatAddress(item.$id.address)}
					metadata={
						network
							? [{ term: 'Network', detail: network.name }]
							: []
					}
				/>
			{/if}
		</span>
	{/snippet}
</CollapsibleList>
