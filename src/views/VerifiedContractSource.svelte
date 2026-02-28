<script lang="ts">
	// Types/constants
	import type { VerifiedContractSource$Id } from '$/data/VerifiedContractSource.ts'
	import { DataSourceId } from '$/constants/data-sources.ts'
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
	const source = $derived(
		sourceQuery.data?.[0]?.row
	)
	const hasFiles = $derived(
		source != null && Object.keys(source.files ?? {}).length > 0,
	)


	// State
	let hasFetched = $state(
		false
	)


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
	annotation={DataSourceId.Sourcify}
	detailsProps={{
		'data-card': '',
		ontoggle: onToggle,
	}}
>
	{#if source?.isLoading && !hasFiles}
		<p data-text="muted">Loading…</p>
	{:else if source?.notFound}
		<p data-text="muted">Contract not verified on Sourcify</p>
	{:else if source?.error}
		<p data-tag="failure">{source.error}</p>
	{:else if hasFiles && source}
		{#if source.metadata?.compiler}
			<p data-text="muted">{source.metadata.compiler}</p>
		{/if}
		<div data-column>
			{#each Object.entries(source.files ?? {}) as [path, content]}
				<details>
					<summary><code>{path}</code></summary>
					<ContractSourceBlock {path} {content} />
				</details>
			{/each}
		</div>
	{/if}
</Collapsible>

