<script lang="ts">
	// Types/constants
	import type { VerifiedContractSource$Id } from '$/data/VerifiedContractSource.ts'
	import { DataSource } from '$/constants/data-sources.ts'
	import {
		fetchVerifiedContractSource,
		verifiedContractSourcesCollection,
	} from '$/collections/VerifiedContractSources.ts'
	import { and, eq, useLiveQuery } from '@tanstack/svelte-db'


	// Props
	let {
		contractId,
	}: {
		contractId: VerifiedContractSource$Id
	} = $props()


	// Context
	const sourceQuery = useLiveQuery(
		(q) =>
			q
				.from({ row: verifiedContractSourcesCollection })
				.where(({ row }) =>
					and(
						eq(row.$id.$network.chainId, contractId.$network.chainId),
						eq(row.$id.address, contractId.address),
					),
				)
				.select(({ row }) => ({ row })),
		[() => contractId.$network.chainId, () => contractId.address],
	)


	// (Derived)
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
		fetchVerifiedContractSource(contractId.$network.chainId, contractId.address).catch(() => {})
	}


	// Components
	import Collapsible from '$/components/Collapsible.svelte'
	import ContractSourceBlock from '$/views/ContractSourceBlock.svelte'
</script>


<Collapsible
	title="Verified Source"
	annotation={DataSource.Sourcify}
	detailsProps={{
		'data-card': '',
		ontoggle: onToggle,
	}}
>
	{#if row?.isLoading && !hasFiles}
		<p data-text="muted">Loading…</p>
	{:else if row?.notFound}
		<p data-text="muted">Contract not verified on Sourcify</p>
	{:else if row?.error}
		<p data-tag="failure">{row.error}</p>
	{:else if hasFiles && row}
		{#if row.metadata?.compiler}
			<p data-text="muted">{row.metadata.compiler}</p>
		{/if}
		<div data-column>
			{#each Object.entries(row.files ?? {}) as [path, content]}
				<details>
					<summary><code>{path}</code></summary>
					<ContractSourceBlock {path} {content} />
				</details>
			{/each}
		</div>
	{/if}
</Collapsible>

