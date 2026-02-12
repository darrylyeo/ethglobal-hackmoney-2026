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
	const nameParam = $derived(page.params.name ?? '')
	const addressParam = $derived(page.params.address ?? '')
	const parsed = $derived(parseNetworkNameParam(nameParam))
	const address = $derived(
		addressParam &&
			matchesEntityRefPattern(addressParam, PatternType.EvmAddress)
			? (addressParam.startsWith('0x')
					? (addressParam as `0x${string}`)
					: (`0x${addressParam}` as `0x${string}`))
			: null,
	)
	const chainId = $derived(parsed?.chainId ?? (0 as ChainId))
	const config = $derived(parsed?.config ?? { name: '' })
	const slug = $derived(parsed?.slug ?? '')
	const valid = $derived(!!parsed && !!address)


	// Actions
	$effect(() => {
		if (valid) fetchContract(chainId, address!).catch(() => {})
	})
</script>


<svelte:head>
	<title>
		{valid ? `Contract ${formatAddress(address!)} · ${config.name}` : 'Contract'}
	</title>
</svelte:head>


<main data-column="gap-2">
	{#if !valid}
		<h1>Not found</h1>
		<p>
			{#if !parsed}
				Network "{nameParam}" could not be resolved.
			{:else}
				Invalid contract address.
			{/if}
		</p>
	{:else}
		<Contract
			chainId={chainId}
			address={address!}
			idSerialized={`${slug}:${address!.toLowerCase()}`}
			href={resolve(`/network/${nameParam}/contract/${address!}`)}
			label={formatAddress(address)}
			metadata={[
				{ term: 'Chain ID', detail: String(chainId) },
				{ term: 'Network', detail: config.name },
			]}
		/>
	{/if}
</main>
