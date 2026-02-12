<script lang="ts">
	// Types/constants
	import type { EvmLog } from '$/api/voltaire.ts'
	import type { ChainId } from '$/constants/networks.ts'


	// Components
	import Address from '$/views/Address.svelte'
	import TruncatedValue from '$/components/TruncatedValue.svelte'


	// Props
	let {
		event,
		chainId,
		decoded,
	}: {
		event: EvmLog
		chainId: ChainId
		decoded?: { name: string; args: Record<string, unknown> }
	} = $props()


	// (Derived)
	const logIndex = $derived(parseInt(event.logIndex, 16))
</script>


<details data-card="radius-2 padding-2" id="event:{logIndex}">
	<summary data-row="gap-2 align-center">
		<code>#{logIndex}</code>
		{#if decoded}
			<code>{decoded.name}</code>
		{:else}
			<Address network={chainId} address={event.address as `0x${string}`} />
			{#if event.topics[0]}
				<TruncatedValue value={event.topics[0]} startLength={10} endLength={4} />
			{/if}
		{/if}
	</summary>

	{#if decoded}
		<dl>
			<dt>Event</dt>
			<dd><code>{decoded.name}</code></dd>
			{#each Object.entries(decoded.args) as [key, val]}
				<dt>{key}</dt>
				<dd>{String(val)}</dd>
			{/each}
		</dl>
		<details>
			<summary>Raw</summary>
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
	{:else}
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
	{/if}
</details>
