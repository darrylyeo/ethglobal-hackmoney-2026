<script lang="ts">
	// Types/constants
	import type { Erc20Token } from '$/constants/coins.ts'
	import { ercTokens } from '$/constants/coins.ts'
	import type { CoinSymbol } from '$/constants/coins.ts'
	import { networksByChainId } from '$/constants/networks.ts'
	import { resolve } from '$app/paths'
	import { formatAddress } from '$/lib/address.ts'
	import Heading from '$/components/Heading.svelte'
	import EntityList from '$/components/EntityList.svelte'
	import Contract from '$/views/Contract.svelte'


	// Props
	let { symbol }: { symbol: CoinSymbol } = $props()


	// (Derived)
	const tokens = $derived(
		ercTokens.filter((t) => t.symbol === symbol) as Erc20Token[],
	)
	const tokensSet = $derived(new Set(tokens))

	function getKey(t: Erc20Token): string {
		return `${t.chainId}:${t.address}`
	}
	function getSortValue(t: Erc20Token): number | string {
		const network = networksByChainId[t.chainId]
		return network?.name ?? t.chainId
	}
</script>


{#snippet ContractsTitle({ countText })}
	<Heading>Contracts ({countText} chains)</Heading>
{/snippet}
<EntityList
		title="Contracts"
		Title={ContractsTitle}
		detailsProps={{ open: true, 'data-card': 'radius-2 padding-4' }}
		loaded={tokensSet.size}
		items={tokensSet}
		getKey={getKey}
		getSortValue={getSortValue}
		placeholderKeys={new Set()}
		scrollPosition="Start"
	>
		{#snippet Item({ key, item, isPlaceholder })}
			<span id="contract:{key}">
				{#if isPlaceholder}
					<code>Contract (loading…)</code>
				{:else}
					{@const network = networksByChainId[item.chainId]}
					{@const slug = network?.slug ?? String(item.chainId)}
					<Contract
						chainId={item.chainId}
						address={item.address}
						idSerialized={`${slug}:${item.address}`}
						href={resolve(`/network/${slug}/contract/${item.address}`)}
						label={formatAddress(item.address)}
						metadata={
							network
								? [{ term: 'Network', detail: network.name }]
								: []
						}
					/>
				{/if}
		</span>
	{/snippet}
</EntityList>
