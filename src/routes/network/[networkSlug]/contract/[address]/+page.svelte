<script lang="ts">
	// Types/constants
	import type { ChainId } from '$/constants/networks.ts'
	import { PatternType } from '$/constants/patterns.ts'
	import { fetchContract } from '$/collections/Contracts.ts'
	import { formatAddress, normalizeAddress } from '$/lib/address.ts'
	import { matchesEntityRefPattern, parseNetworkNameParam } from '$/lib/patterns.ts'


	// Context
	import { page } from '$app/state'
	import { resolve } from '$app/paths'

	// (Derived)
	const networkSlug = $derived(
		page.params.networkSlug ?? ''
	)
	const addrParam = $derived(
		page.params.address ?? ''
	)
	const route = $derived(
		parseNetworkNameParam(networkSlug)
	)
	const address = $derived(
		addrParam && matchesEntityRefPattern(addrParam, PatternType.EvmAddress)
			? normalizeAddress(
				addrParam.startsWith('0x') ? addrParam : `0x${addrParam}`,
			) ?? null
			: null
	)
	const chainId = $derived(
		route?.chainId ?? (0 as ChainId)
	)
	const network = $derived(
		route?.network ?? { name: '' }
	)
	const valid = $derived(
		!!route && !!address
	)


	// Actions
	$effect(() => {
		if (valid && address) fetchContract(chainId, address).catch(() => {})
	})


	// Components
	import Contract from '$/views/Contract.svelte'
</script>


<svelte:head>
	<title>
		{valid && address
			? `${network.name} · ${formatAddress(address)}`
			: 'Contract'}
	</title>
</svelte:head>


<main data-column>
	{#if !valid}
		<h1>Not found</h1>
		<p>
			{#if !route}
				Network "{networkSlug}" could not be resolved.
			{:else}
				Invalid contract address.
			{/if}
		</p>
	{:else if address}
		<Contract
			contractId={{ $network: { chainId }, address }}
			idSerialized={`${chainId}:${address.toLowerCase()}`}
			titleHref={resolve(`/network/${chainId}/contract/${address}`)}
			label={formatAddress(address)}
			metadata={[
				{ term: 'Chain ID', detail: String(chainId) },
				{ term: 'Network', detail: network.name },
			]}
		/>
	{/if}
</main>
