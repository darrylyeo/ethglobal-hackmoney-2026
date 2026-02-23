<script lang="ts">
	// Types/constants
	import { parseNetworkNameParam } from '$/lib/patterns.ts'


	// Context
	import { page } from '$app/state'
	import { resolve } from '$app/paths'


	// (Derived)
	const networkSlug = $derived(page.params.networkSlug ?? '')
	const route = $derived(parseNetworkNameParam(networkSlug))
	const chainId = $derived(route?.chainId ?? 0)
	const network = $derived(route?.network ?? { name: '' })


	// Components
	import NetworkName from '$/views/NetworkName.svelte'
</script>




<svelte:head>
	<title>
		Contracts · {route
			? network.name
			: 'Network'}
	</title>
</svelte:head>


<main data-column="gap-4">
	{#if !route}
		<h1>Not found</h1>
		<p>Network "{networkSlug}" could not be resolved.</p>
	{:else}
		<h1>Contracts · <NetworkName networkId={{ chainId }} /></h1>
		<p data-text="muted">
			<a href={resolve(`/network/${networkSlug}`)} data-link>← {network.name}</a>
		</p>
		<p data-text="muted">
			Browse a contract by visiting <code>/network/{networkSlug}/contract/[address]</code> with
			a contract address. Discover deployed contracts from an
			<a href={resolve('/account/0x0000000000000000000000000000000000000000')} data-link>
				account page
			</a>.
		</p>
	{/if}
</main>
