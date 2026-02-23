<script lang="ts">
	// Types/constants
	import type { ChainId } from '$/constants/networks.ts'
	import type { Contract$Id, ContractAbi } from '$/data/Contract.ts'
	import { DataSource } from '$/constants/data-sources.ts'
	import { EntityType } from '$/data/$EntityType.ts'
	import { contractsCollection, fetchContract } from '$/collections/Contracts.ts'
	import {
		fetchVerifiedContractSource,
		verifiedContractSourcesCollection,
	} from '$/collections/VerifiedContractSources.ts'
	import { and, eq, useLiveQuery } from '@tanstack/svelte-db'


	// Props
	let {
		contractId: contractIdProp,
		chainId: chainIdProp,
		address: addressProp,
		idSerialized,
		href,
		label,
		metadata,
		abi: abiProp,
		contractName,
	}: {
		contractId?: Contract$Id
		chainId?: ChainId
		address?: `0x${string}`
		idSerialized: string
		href: string
		label: string
		metadata: Array<{ term: string; detail: string }>
		abi?: ContractAbi
		contractName?: string
	} = $props()


	// (Derived)
	const chainId = $derived(contractIdProp?.$network.chainId ?? chainIdProp!)
	const address = $derived(contractIdProp?.address ?? addressProp!)


	// Context
	const contractIdResolved = $derived(
		contractIdProp ?? (chainId != null && address != null ? { $network: { chainId }, address } : null),
	)
	const contractQuery = useLiveQuery(
		(q) =>
			q
				.from({ row: contractsCollection })
				.where(({ row }) =>
					and(eq(row.$id.$network.chainId, chainId), eq(row.$id.address, address)),
				)
				.select(({ row }) => ({ row })),
		[() => chainId, () => address],
	)
	const sourceQuery = useLiveQuery(
		(q) =>
			q
				.from({ row: verifiedContractSourcesCollection })
				.where(({ row }) =>
					and(eq(row.$id.$network.chainId, chainId), eq(row.$id.address, address)),
				)
				.select(({ row }) => ({ row })),
		[() => chainId, () => address],
	)


	// (Derived)
	const contractRow = $derived(contractQuery.data?.[0]?.row)
	const abi = $derived(abiProp ?? contractRow?.abi)
	const sourceRow = $derived(sourceQuery.data?.[0]?.row)
	const hasSourceFiles = $derived(
		sourceRow != null
		&& !sourceRow.notFound
		&& Object.keys(sourceRow.files ?? {}).length > 0,
	)
	const hasAbi = $derived(Array.isArray(abi) && abi.length > 0)
	const fetchSettled = $derived(
		sourceRow != null && sourceRow.isLoading === false,
	)
	const isLoading = $derived(!fetchSettled && !hasAbi)
	const showNotVerified = $derived(fetchSettled && !hasAbi)


	// State
	let hasFetchedSource = $state(false)


	// Actions
	$effect(() => {
		if (!hasAbi && !fetchSettled) void fetchContract(chainId, address).catch(() => {})
	})
	const onSourceToggle = (e: Event) => {
		const details = e.currentTarget as HTMLDetailsElement
		if (!details.open || hasFetchedSource) return
		hasFetchedSource = true
		fetchVerifiedContractSource(chainId, address).catch(() => {})
	}


	// Components
	import Boundary from '$/components/Boundary.svelte'
	import EntityView from '$/components/EntityView.svelte'
	import Address, { AddressFormat } from '$/views/Address.svelte'
	import ContractAction from '$/views/ContractAction.svelte'
	import ContractSourceBlock from '$/views/ContractSourceBlock.svelte'
	import NetworkName from '$/views/NetworkName.svelte'
</script>


<EntityView
	entityType={EntityType.Contract}
	entityId={{ $network: { chainId }, address }}
	{idSerialized}
	{href}
	{label}
	{metadata}
	annotation="Contract"
>
	{#snippet Title()}
		<span data-row="inline">
			<code>{address}</code>
			<NetworkName networkId={contractIdResolved?.$network} showIcon={false} />
		</span>
	{/snippet}

	<Address
		actorId={contractIdResolved ? { $network: contractIdResolved.$network, address: contractIdResolved.address } : undefined}
		format={AddressFormat.MiddleTruncated}
		isVertical
	/>

	{#if hasSourceFiles && sourceRow?.files}
		<Boundary>
			<details data-card ontoggle={onSourceToggle}>
				<summary>
					<h3>Verified Source</h3>
					<span data-text="annotation">{DataSource.Sourcify}</span>
				</summary>
				{#if sourceRow.metadata?.compiler}
					<p data-text="muted">{sourceRow.metadata.compiler}</p>
				{/if}
				<div data-column>
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

	{#if hasAbi && abi && contractIdResolved}
		<Boundary>
			<ContractAction
				contractId={contractIdResolved}
				{abi}
				{contractName}
			/>
		</Boundary>
	{:else if isLoading}
		<p data-text="muted">Checking verification…</p>
	{:else if showNotVerified}
		<p data-text="muted">Contract not verified. No ABI available for interaction.</p>
	{/if}
</EntityView>
