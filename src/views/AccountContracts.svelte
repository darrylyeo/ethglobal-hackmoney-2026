<script lang="ts">
	// Types/constants
	import {
		fetchContractsDeployedBy,
		SUPPORTED_DISCOVERY_CHAINS,
	} from '$/api/contract-discovery.ts'
	import type { Actor$Id } from '$/data/Actor.ts'
	import { contractsCollection, fetchContract } from '$/collections/Contracts.ts'
	import { networksByChainId } from '$/constants/networks.ts'
	import { and, eq, useLiveQuery } from '@tanstack/svelte-db'


	// Context
	import { resolve } from '$app/paths'


	// Props
	let {
		actorId,
	}: {
		actorId: Actor$Id | null
	} = $props()


	// (Derived)
	const addressNorm = $derived(actorId?.address ?? null)


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
		if (!actorId?.address) return
		discovering = true
		discoveryError = null
		try {
			for (const chainId of SUPPORTED_DISCOVERY_CHAINS) {
				const items = await fetchContractsDeployedBy(chainId, actorId.address)
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
	import Collapsible from '$/components/Collapsible.svelte'
	import Address, { AddressFormat } from '$/views/Address.svelte'
	import NetworkName from '$/views/NetworkName.svelte'
</script>

<Collapsible
	title="Contracts"
	annotation="{contracts.length} deployed"
	detailsProps={{ 'data-column': 'gap-2' }}
>
	{#if actorId}
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
			<ul data-column>
				{#each contracts as contract}
					<li>
						<a
							href={resolve(
								`/network/${contract.$id.$network.chainId}/contract/${contract.$id.address}`,
							)}
							data-link
						>
							<Address
								actorId={{ $network: contract.$id.$network, address: contract.$id.address }}
								format={AddressFormat.MiddleTruncated}
							/>
							<NetworkName networkId={contract.$id.$network} showIcon={false} />
						</a>
					</li>
				{/each}
			</ul>
		{/if}
	{:else}
		<p data-text="muted">Connect or enter an address to view deployed contracts.</p>
	{/if}
</Collapsible>
