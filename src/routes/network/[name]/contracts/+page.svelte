<script lang="ts">
	// Types/constants
	import { parseNetworkNameParam } from '$/lib/patterns.ts'


	// Context
	import { page } from '$app/state'
	import { resolve } from '$app/paths'


	// (Derived)
	const name = $derived(page.params.name ?? '')
	const route = $derived(parseNetworkNameParam(name))
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
		<p>Network "{name}" could not be resolved.</p>
	{:else}
		<h1>Contracts · <NetworkName chainId={chainId} /></h1>
		<p data-text="muted">
			<a href={resolve(`/network/${name}`)} data-link>← {network.name}</a>
		</p>
		<p data-text="muted">
			Browse a contract by visiting <code>/network/{name}/contract/[address]</code> with
			a contract address. Discover deployed contracts from an
			<a href={resolve('/account/0x0000000000000000000000000000000000000000')} data-link>
				account page
			</a>.
		</p>
	{/if}
</main>
