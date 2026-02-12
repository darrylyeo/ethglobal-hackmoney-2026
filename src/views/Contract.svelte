<script lang="ts">
	// Types/constants
	import type { ChainId } from '$/constants/networks.ts'
	import type { ContractAbi } from '$/data/Contract.ts'
	import { EntityType } from '$/data/$EntityType.ts'
	import { DataSource } from '$/constants/data-sources.ts'
	import { and, eq, useLiveQuery } from '@tanstack/svelte-db'
	import {
		fetchVerifiedContractSource,
		verifiedContractSourcesCollection,
	} from '$/collections/VerifiedContractSources.ts'
	import { contractsCollection } from '$/collections/Contracts.ts'


	// Components
	import EntityView from '$/components/EntityView.svelte'
	import Address, { AddressFormat } from '$/views/Address.svelte'
	import ContractAction from '$/views/ContractAction.svelte'
	import ContractSourceBlock from '$/views/ContractSourceBlock.svelte'
	import Boundary from '$/components/Boundary.svelte'
	import NetworkName from '$/views/NetworkName.svelte'


	// Props
	let {
		chainId,
		address,
		idSerialized,
		href,
		label,
		metadata,
		abi: abiProp,
		contractName,
	}: {
		chainId: ChainId
		address: `0x${string}`
		idSerialized: string
		href: string
		label: string
		metadata: Array<{ term: string; detail: string }>
		abi?: ContractAbi
		contractName?: string
	} = $props()


	// (Derived)
	const addressNorm = $derived(address.toLowerCase())
	const contractQuery = useLiveQuery(
		(q) =>
			q
				.from({ row: contractsCollection })
				.where(({ row }) =>
					and(eq(row.$id.$network.chainId, chainId), eq(row.$id.address, addressNorm)),
				)
				.select(({ row }) => ({ row })),
		[() => chainId, () => addressNorm],
	)
	const contractRow = $derived(contractQuery.data?.[0]?.row)
	const abi = $derived(abiProp ?? contractRow?.abi)
	const sourceQuery = useLiveQuery(
		(q) =>
			q
				.from({ row: verifiedContractSourcesCollection })
				.where(({ row }) =>
					and(eq(row.$id.$network.chainId, chainId), eq(row.$id.address, addressNorm)),
				)
				.select(({ row }) => ({ row })),
		[() => chainId, () => addressNorm],
	)
	const sourceRow = $derived(sourceQuery.data?.[0]?.row)
	const hasSourceFiles = $derived(
		sourceRow != null &&
			!sourceRow.notFound &&
			Object.keys(sourceRow.files ?? {}).length > 0,
	)


	// State
	let hasFetchedSource = $state(false)


	// Actions
	const onSourceToggle = (e: Event) => {
		const details = e.currentTarget as HTMLDetailsElement
		if (!details.open || hasFetchedSource) return
		hasFetchedSource = true
		fetchVerifiedContractSource(chainId, address).catch(() => {})
	}
</script>


<EntityView
	entityType={EntityType.Contract}
	{idSerialized}
	{href}
	{label}
	{metadata}
	annotation="Contract"
>
	{#snippet Title()}
		<span data-row="inline gap-2">
			<code>{address}</code>
			<NetworkName {chainId} showIcon={false} />
		</span>
	{/snippet}

	<Address network={chainId} {address} format={AddressFormat.MiddleTruncated} isVertical />

	{#if hasSourceFiles && sourceRow?.files}
		<Boundary>
			<details data-card="radius-2 padding-4" ontoggle={onSourceToggle}>
				<summary>
					<h3>Verified Source</h3>
					<span data-text="annotation">{DataSource.Sourcify}</span>
				</summary>
				{#if sourceRow.metadata?.compiler}
					<p data-text="muted">{sourceRow.metadata.compiler}</p>
				{/if}
				<div data-column="gap-2">
					{#each Object.entries(sourceRow.files) as [path, content]}
						<details>
							<summary><code>{path}</code></summary>
							<ContractSourceBlock {path} {content} />
						</details>
					{/each}
				</div>
			</details>
		</Boundary>
	{/if}

	{#if Array.isArray(abi) && abi.length > 0}
		<Boundary>
			<ContractAction
				{chainId}
				{address}
				{abi}
				{contractName}
			/>
		</Boundary>
	{:else}
		<p data-text="muted">Contract not verified. No ABI available for interaction.</p>
	{/if}
</EntityView>
