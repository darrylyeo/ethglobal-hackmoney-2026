<script lang="ts">
	// Types/constants
	import { page } from '$app/state'
	import { resolve } from '$app/paths'
	import { parseNetworkNameParam } from '$/lib/patterns.ts'
	import NetworkName from '$/views/NetworkName.svelte'


	// (Derived)
	const nameParam = $derived(page.params.name ?? '')
	const parsed = $derived(parseNetworkNameParam(nameParam))
	const chainId = $derived(parsed?.chainId ?? 0)
	const config = $derived(parsed?.config ?? { name: '' })
</script>


<svelte:head>
	<title>Contracts · {parsed ? config.name : 'Network'}</title>
</svelte:head>


<main data-column="gap-4">
	{#if !parsed}
		<h1>Not found</h1>
		<p>Network "{nameParam}" could not be resolved.</p>
	{:else}
		<h1>Contracts · <NetworkName chainId={chainId} /></h1>
		<p data-text="muted">
			<a href={resolve(`/network/${nameParam}`)} data-link>← {config.name}</a>
		</p>
		<p data-text="muted">
			Browse a contract by visiting <code>/network/{nameParam}/contract/[address]</code> with
			a contract address. Discover deployed contracts from an
			<a href={resolve('/account/0x0000000000000000000000000000000000000000')} data-link>
				account page
			</a>.
		</p>
	{/if}
</main>
