<script lang="ts">
	// Types/constants
	import type { Network$Id } from '$/data/Network.ts'
	import { EntityLayout } from '$/components/EntityView.svelte'
	import { eq, useLiveQuery } from '@tanstack/svelte-db'
	import { contractsCollection } from '$/collections/Contracts.ts'
	import { getPrecompilesForChain } from '$/constants/precompiles/index.ts'
	import { formatAddress } from '$/lib/address.ts'
	import { resolve } from '$app/paths'
	import { SvelteSet } from 'svelte/reactivity'


	// Props
	let {
		networkId,
		detailsProps = {},
	}: {
		networkId: Network$Id
		detailsProps?: Record<string, unknown>
	} = $props()

	// (Derived)
	const chainId = $derived(
		networkId.chainId
	)
	const contractsQuery = useLiveQuery(
		(q) =>
			q
				.from({ row: contractsCollection })
				.where(({ row }) => eq(row.$id.$network.chainId, chainId))
				.select(({ row }) => ({ row })),
		[() => chainId],
	)
	const contracts = $derived(
		(contractsQuery.data ?? []).map(({ row: contract }) => contract)
	)
	const precompiles = $derived(
		getPrecompilesForChain(chainId)
	)
	const norm = (addr: string) => addr.slice(2).toLowerCase().padStart(40, '0')
	const precompileAddrs = $derived(
		new Set(precompiles.map((p) => norm(p.address)))
	)
	const otherContracts = $derived(
		contracts.filter((c) => !precompileAddrs.has(norm(c.$id.address)))
	)
	type DisplayItem = { address: `0x${string}`; name: string | null; precompile: boolean }
	const displayItems = $derived<DisplayItem[]>([
		...precompiles.map((p) => ({
			address: p.address as `0x${string}`,
			name: p.name,
			precompile: true,
		})),
		...otherContracts.map((c) => ({
			address: c.$id.address,
			name: null as string | null,
			precompile: false,
		})),
	])
	const items = $derived(
		new SvelteSet(displayItems)
	)
	const getKey = (item: DisplayItem) =>
		item.precompile ? `${item.address}:${item.name}` : item.address
	const getSortValue = (item: DisplayItem) => item.address.toLowerCase()


	// Components
	import Heading from '$/components/Heading.svelte'
	import Contract from '$/views/Contract.svelte'
	import CollapsibleList from '$/components/CollapsibleList.svelte'
</script>


<CollapsibleList
	title="Contracts"
	loaded={displayItems.length}
	{items}
	{getKey}
	{getSortValue}
	placeholderKeys={new Set()}
	detailsProps={{ open: true, ...detailsProps }}
	scrollPosition="Start"
>
	{#snippet Empty()}
		<p data-text="muted">No contracts.</p>
	{/snippet}

	{#snippet Title({ title, countText })}
		<Heading>
			<a href={resolve(`/network/${chainId}/contracts`)} data-link>{title}</a> ({countText} known)
		</Heading>
	{/snippet}

	{#snippet Item({ key, item, isPlaceholder })}
		<span id="contract:{key}">
			{#if isPlaceholder}
				<code>Contract (loading…)</code>
			{:else if item}
				<Contract
					contractId={{ $network: { chainId }, address: item.address }}
					idSerialized={`${chainId}:${item.address.toLowerCase()}`}
					titleHref={resolve(`/network/${chainId}/contract/${item.address}`)}
					label={item.name ?? formatAddress(item.address)}
					metadata={[]}
					layout={EntityLayout.PageSection}
					open={false}
				/>
			{/if}
		</span>
	{/snippet}
</CollapsibleList>
