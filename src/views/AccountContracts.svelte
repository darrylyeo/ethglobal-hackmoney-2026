<script lang="ts">
	// Types/constants
	import {
		fetchContractsDeployedBy,
		SUPPORTED_DISCOVERY_CHAINS,
	} from '$/api/contract-discovery.ts'
	import { contractsCollection, fetchContract } from '$/collections/Contracts.ts'
	import { networksByChainId } from '$/constants/networks.ts'
	import { formatAddress } from '$/lib/address.ts'
	import { and, eq, useLiveQuery } from '@tanstack/svelte-db'


	// Context
	import { resolve } from '$app/paths'


	// Props
	let {
		selectedActor,
	}: {
		selectedActor: `0x${string}` | null
	} = $props()


	// (Derived)
	const addressNorm = $derived(selectedActor ?? null)


	// Context
	const contractsQuery = useLiveQuery(
		(q) =>
			addressNorm
				? q
						.from({ row: contractsCollection })
						.where(({ row }) => eq(row.deployer, addressNorm))
						.select(({ row }) => ({ row }))
				: q
						.from({ row: contractsCollection })
						.where(({ row }) => eq(row.$id.$network.chainId, -1))
						.select(({ row }) => ({ row })),
		[() => addressNorm],
	)


	// (Derived)
	const contracts = $derived((contractsQuery.data ?? []).map((r) => r.row))


	// State
	let discovering = $state(false)
	let discoveryError = $state<string | null>(null)


	// Actions
	const discover = async () => {
		if (!selectedActor) return
		discovering = true
		discoveryError = null
		try {
			for (const chainId of SUPPORTED_DISCOVERY_CHAINS) {
				const items = await fetchContractsDeployedBy(chainId, selectedActor)
				for (const c of items) {
					await fetchContract(c.chainId, c.address, c.deployer)
				}
			}
		} catch (e) {
			discoveryError = e instanceof Error ? e.message : String(e)
		} finally {
			discovering = false
		}
	}


	// Components
	import NetworkName from '$/views/NetworkName.svelte'
	import Address from '$/views/Address.svelte'
</script>

<details data-card data-column="gap-2">
	<summary>
		<div data-row="wrap">
			<h3>Contracts</h3>
			<span data-text="annotation">
				{contracts.length} deployed
			</span>
		</div>
	</summary>

	{#if selectedActor}
		<button
			disabled={discovering}
			onclick={discover}
		>
			{discovering ? 'Discovering…' : 'Discover deployed contracts'}
		</button>
		{#if discoveryError}
			<p data-tag="failure">{discoveryError}</p>
		{/if}

		{#if contracts.length === 0}
			<p data-text="muted">No contracts found. Click Discover to fetch from block explorers.</p>
		{:else}
			<ul data-column="gap-2">
				{#each contracts as contract}
					{@const slug =
						networksByChainId[contract.$id.$network.chainId]?.slug ??
						String(contract.$id.$network.chainId)}
					<li>
						<a
							href={resolve(
								`/network/${slug}/contract/${contract.$id.address}`,
							)}
							data-link
						>
							<Address
								network={contract.$id.$network.chainId}
								address={contract.$id.address}
								format="middle-truncated"
							/>
							<NetworkName chainId={contract.$id.$network.chainId} showIcon={false} />
						</a>
					</li>
				{/each}
			</ul>
		{/if}
	{:else}
		<p data-text="muted">Connect or enter an address to view deployed contracts.</p>
	{/if}
</details>
