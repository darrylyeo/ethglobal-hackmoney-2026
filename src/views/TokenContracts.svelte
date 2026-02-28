<script lang="ts">
	// Types/constants
	import type { Erc20Token } from '$/constants/coin-instances.ts'
	import { erc20InstancesByCoinId } from '$/constants/coin-instances.ts'
	import { CoinId } from '$/constants/coins.ts'
	import { networksByChainId } from '$/constants/networks.ts'
	import { resolve } from '$app/paths'
	import { stringify } from 'devalue'


	// Components
	import Collapsible from '$/components/Collapsible.svelte'
	import Address, { AddressFormat } from '$/views/Address.svelte'


	// Props
	let { coinId }: { coinId: CoinId } = $props()

	// (Derived)
	const tokens = $derived(
		(erc20InstancesByCoinId.get(coinId) ?? []) as Erc20Token[],
	)
</script>

{#if tokens.length > 0}
	<Collapsible
		title="Token contracts"
		annotation={`${tokens.length} chains`}
		detailsProps={{ 'data-card': '' }}
	>
		<ul data-column="gap-1">
			{#each tokens as t (stringify(t.$id))}
				{@const network = networksByChainId[t.$id.$network.chainId]}
				<li>
					<a
					href={resolve(`/network/${t.$id.$network.chainId}/contract/${t.$id.address}`)}
					data-link
				>
					<Address
						actorId={{ $network: t.$id.$network, address: t.$id.address }}
						format={AddressFormat.MiddleTruncated}
					/>
						{#if network}
							<span data-text="muted"> · {network.name}</span>
						{/if}
					</a>
				</li>
			{/each}
		</ul>
	</Collapsible>
{/if}
