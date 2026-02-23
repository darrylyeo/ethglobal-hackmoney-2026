<script lang="ts">
	// Types/constants
	import type { Network$Id } from '$/data/Network.ts'
	import { eq, useLiveQuery } from '@tanstack/svelte-db'
	import { contractsCollection } from '$/collections/Contracts.ts'
	import { resolve } from '$app/paths'
	import { stringify } from 'devalue'


	// Components
	import Collapsible from '$/components/Collapsible.svelte'
	import Address, { AddressFormat } from '$/views/Address.svelte'


	// Props
	let {
		networkId: networkIdProp,
		chainId: chainIdProp,
		nameParam,
	}: {
		networkId?: Network$Id
		chainId?: number
		nameParam: string
	} = $props()


	// (Derived)
	const chainId = $derived(networkIdProp?.chainId ?? chainIdProp ?? undefined)
	const contractsQuery = useLiveQuery(
		(q) =>
			q
				.from({ row: contractsCollection })
				.where(({ row }) =>
					chainId != null
						? eq(row.$id.$network.chainId, chainId)
						: eq(row.$id.$network.chainId, -1),
				)
				.select(({ row }) => ({ row })),
		[() => chainId],
	)
	const contracts = $derived((contractsQuery.data ?? []).map((r) => r.row))
</script>

<Collapsible
	title="Contracts"
	href={resolve(`/network/${nameParam}/contracts`)}
	annotation={`${contracts.length} known`}
>
	{#if contracts.length === 0}
		<p data-text="muted">No contracts yet.</p>
	{:else}
		<ul data-column="gap-1">
			{#each contracts.slice(0, 20) as c (stringify(c.$id))}
				<li>
					<a href={resolve(`/network/${nameParam}/contract/${c.$id.address}`)} data-link>
						<Address actorId={{ $network: c.$id.$network, address: c.$id.address }} format={AddressFormat.MiddleTruncated} />
					</a>
				</li>
			{/each}
		</ul>
		{#if contracts.length > 20}
			<p data-text="muted">…and {contracts.length - 20} more.</p>
		{/if}
	{/if}
</Collapsible>
