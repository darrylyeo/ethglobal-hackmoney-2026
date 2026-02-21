<script lang="ts">
	// Types/constants
	import type { Erc20Token } from '$/constants/coin-instances.ts'
	import { erc20InstancesByCoinId } from '$/constants/coin-instances.ts'
	import { CoinId } from '$/constants/coins.ts'
	import { networksByChainId } from '$/constants/networks.ts'
	import { resolve } from '$app/paths'


	// Components
	import Address, { AddressFormat } from '$/views/Address.svelte'


	// Props
	let { coinId }: { coinId: CoinId } = $props()


	// (Derived)
	const tokens = $derived(
		(erc20InstancesByCoinId.get(coinId) ?? []) as Erc20Token[],
	)
</script>

{#if tokens.length > 0}
	<details data-card="radius-2 padding-4">
		<summary>
			<h3>Token contracts</h3>
			<span data-text="annotation">{tokens.length} chains</span>
		</summary>
		<ul data-column="gap-1">
			{#each tokens as t (t.chainId + t.address)}
				{@const network = networksByChainId[t.chainId]}
				{@const slug = network ? network.slug : String(t.chainId)}
				<li>
					<a
					href={resolve(`/network/${slug}/contract/${t.address}`)}
					data-link
				>
					<Address
						network={t.chainId}
						address={t.address}
							format={AddressFormat.MiddleTruncated}
						/>
						{#if network}
							<span data-text="muted"> · {network.name}</span>
						{/if}
					</a>
				</li>
			{/each}
		</ul>
	</details>
{/if}
