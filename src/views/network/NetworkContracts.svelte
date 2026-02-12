<script lang="ts">
	// Types/constants
	import type { ChainId } from '$/constants/networks.ts'
	import { eq, useLiveQuery } from '@tanstack/svelte-db'
	import { contractsCollection } from '$/collections/Contracts.ts'
	import { resolve } from '$app/paths'


	// Components
	import Address, { AddressFormat } from '$/views/Address.svelte'


	// Props
	let {
		chainId,
		nameParam,
	}: {
		chainId: ChainId
		nameParam: string
	} = $props()


	// (Derived)
	const contractsQuery = useLiveQuery(
		(q) =>
			q
				.from({ row: contractsCollection })
				.where(({ row }) => eq(row.$id.$network.chainId, chainId))
				.select(({ row }) => ({ row })),
		[() => chainId],
	)
	const contracts = $derived((contractsQuery.data ?? []).map((r) => r.row))
</script>

<details data-card="radius-2 padding-4">
	<summary>
		<h3>Contracts</h3>
		<span data-text="annotation">{contracts.length} known</span>
	</summary>
	{#if contracts.length === 0}
		<p data-text="muted">
			<a href={resolve(`/network/${nameParam}/contracts`)} data-link>Browse contracts</a>
		</p>
	{:else}
		<ul data-column="gap-1">
			{#each contracts.slice(0, 20) as c (c.$id.$network.chainId + c.$id.address)}
				<li>
					<a href={resolve(`/network/${nameParam}/contract/${c.$id.address}`)} data-link>
						<Address network={chainId} address={c.$id.address} format={AddressFormat.MiddleTruncated} />
					</a>
				</li>
			{/each}
		</ul>
		{#if contracts.length > 20}
			<p>
				<a href={resolve(`/network/${nameParam}/contracts`)} data-link>
					View all {contracts.length}…
				</a>
			</p>
		{/if}
	{/if}
</details>
