<script lang="ts">
	// Types/constants
	import { parseNetworkNameParam } from '$/lib/patterns.ts'


	// Context
	import { page } from '$app/state'
	import { resolve } from '$app/paths'

	// (Derived)
	const networkSlug = $derived(
		page.params.networkSlug ?? ''
	)
	const route = $derived(
		parseNetworkNameParam(networkSlug)
	)
	const chainId = $derived(
		route?.chainId ?? 0
	)
	const networkId = $derived(
		route ? { chainId } : undefined
	)
	const network = $derived(
		route?.network ?? { name: '' }
	)


	// Components
	import NetworkName from '$/views/NetworkName.svelte'
	import ContractsList from '$/views/network/ContractsList.svelte'
</script>


<svelte:head>
	<title>
		{route
			? `${network.name} · Contracts`
			: 'Contracts'}
	</title>
</svelte:head>


<main data-column="gap-4">
	{#if !route}
		<h1>
			Not found
		</h1>
		<p>
			Network "{networkSlug}" could not be resolved.
		</p>
	{:else}
		<h1>
			Contracts · <NetworkName {networkId} />
		</h1>
		<p data-text="muted">
			<a
				href={resolve(`/network/${chainId}`)}
				data-link
			>
				← {network.name}
			</a>
		</p>

		<ContractsList
			{networkId}
			detailsProps={{ open: true }}
		/>
	{/if}
</main>
