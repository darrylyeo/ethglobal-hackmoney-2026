<script lang="ts">


	// Types/constants
	import type { EvmLog } from '$/api/voltaire.ts'
	import type { ChainId } from '$/constants/networks.ts'


	// Components
	import Address from '$/components/Address.svelte'
	import TruncatedValue from '$/components/TruncatedValue.svelte'


	// Props
	let {
		event,
		chainId,
	}: {
		event: EvmLog,
		chainId: ChainId,
	} = $props()


	// (Derived)
	const logIndex = $derived(parseInt(event.logIndex, 16))
</script>


<details data-card="radius-2 padding-2" id="event:{logIndex}">
	<summary data-row="gap-2 align-center">
		<code>#{logIndex}</code>
		<Address network={chainId} address={event.address as `0x${string}`} />
		{#if event.topics[0]}
			<TruncatedValue value={event.topics[0]} startLength={10} endLength={4} />
		{/if}
	</summary>

	<dl>
		<dt>Log Index</dt>
		<dd>{logIndex}</dd>

		<dt>Address</dt>
		<dd><Address network={chainId} address={event.address as `0x${string}`} /></dd>

		{#each event.topics as topic, i}
			<dt>Topic {i}</dt>
			<dd><TruncatedValue value={topic} /></dd>
		{/each}

		{#if event.data !== '0x'}
			<dt>Data</dt>
			<dd>
				<TruncatedValue value={event.data} startLength={10} endLength={8} />
				<span>({Math.max(0, (event.data.length - 2) / 2)} bytes)</span>
			</dd>
		{/if}
	</dl>
</details>
