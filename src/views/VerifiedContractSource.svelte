<script lang="ts">
	// Types/constants
	import type { ChainId } from '$/constants/networks.ts'
	import { and, eq, useLiveQuery } from '@tanstack/svelte-db'
	import {
		fetchVerifiedContractSource,
		verifiedContractSourcesCollection,
	} from '$/collections/VerifiedContractSources.ts'
	import { DataSource } from '$/constants/data-sources.ts'
	import ContractSourceBlock from '$/views/ContractSourceBlock.svelte'


	// Props
	let {
		chainId,
		address,
	}: {
		chainId: ChainId
		address: `0x${string}`
	} = $props()


	// (Derived)
	const sourceQuery = useLiveQuery(
		(q) =>
			q
				.from({ row: verifiedContractSourcesCollection })
				.where(({ row }) =>
					and(
						eq(row.$id.$network.chainId, chainId),
						eq(row.$id.address, address),
					),
				)
				.select(({ row }) => ({ row })),
		[() => chainId, () => address],
	)
	const row = $derived(sourceQuery.data?.[0]?.row)
	const hasFiles = $derived(
		row != null && Object.keys(row.files ?? {}).length > 0,
	)


	// State
	let hasFetched = $state(false)


	// Actions
	const onToggle = (e: Event) => {
		const details = e.currentTarget as HTMLDetailsElement
		if (!details.open || hasFetched) return
		hasFetched = true
		fetchVerifiedContractSource(chainId, address).catch(() => {})
	}
</script>


<details data-card="radius-2 padding-4" ontoggle={onToggle}>
	<summary>
		<h3>Verified Source</h3>
		<span data-text="annotation">{DataSource.Sourcify}</span>
	</summary>
	{#if row?.isLoading && !hasFiles}
		<p data-text="muted">Loading…</p>
	{:else if row?.notFound}
		<p data-text="muted">Contract not verified on Sourcify</p>
	{:else if row?.error}
		<p data-tag="failure">{row.error}</p>
	{:else if hasFiles}
		{#if row.metadata?.compiler}
			<p data-text="muted">{row.metadata.compiler}</p>
		{/if}
		<div data-column="gap-2">
			{#each Object.entries(row!.files) as [path, content]}
				<details>
					<summary><code>{path}</code></summary>
					<ContractSourceBlock {path} {content} />
				</details>
			{/each}
		</div>
	{/if}
</details>

