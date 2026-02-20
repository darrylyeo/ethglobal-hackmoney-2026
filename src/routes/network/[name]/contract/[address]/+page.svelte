<script lang="ts">
	// Types/constants
	import type { ChainId } from '$/constants/networks.ts'
	import { PatternType } from '$/constants/patterns.ts'
	import { matchesEntityRefPattern } from '$/lib/patterns.ts'
	import { parseNetworkNameParam } from '$/lib/patterns.ts'
	import { page } from '$app/state'
	import { resolve } from '$app/paths'
	import { fetchContract } from '$/collections/Contracts.ts'
	import Contract from '$/views/Contract.svelte'
	import { formatAddress } from '$/lib/address.ts'


	// (Derived)
	const name = $derived(page.params.name ?? '')
	const addrParam = $derived(page.params.address ?? '')
	const route = $derived(parseNetworkNameParam(name))
	const address = $derived(
		addrParam && matchesEntityRefPattern(addrParam, PatternType.EvmAddress) ?
			(addrParam.startsWith('0x') ?
				(addrParam as `0x${string}`)
			: (`0x${addrParam}` as `0x${string}`))
		: null,
	)
	const chainId = $derived(route?.chainId ?? (0 as ChainId))
	const network = $derived(route?.network ?? { name: '' })
	const slug = $derived(route?.slug ?? '')
	const valid = $derived(!!route && !!address)


	// Actions
	$effect(() => {
		if (valid && address) fetchContract(chainId, address).catch(() => {})
	})
</script>


<svelte:head>
	<title>
		{valid && address ?
			`Contract ${formatAddress(address)} · ${network.name}`
		: 'Contract'}
	</title>
</svelte:head>


<main data-column="gap-2">
	{#if !valid}
		<h1>Not found</h1>
		<p>
			{#if !route}
				Network "{name}" could not be resolved.
			{:else}
				Invalid contract address.
			{/if}
		</p>
	{:else if address}
		<Contract
			chainId={chainId}
			address={address}
			idSerialized={`${slug}:${address.toLowerCase()}`}
			href={resolve(`/network/${name}/contract/${address}`)}
			label={formatAddress(address)}
			metadata={[
				{ term: 'Chain ID', detail: String(chainId) },
				{ term: 'Network', detail: network.name },
			]}
		/>
	{/if}
</main>
