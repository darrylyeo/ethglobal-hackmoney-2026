<script lang="ts">
	import type { EthLog } from '$/api/voltaire'

	let { event }: { event: EthLog } = $props()
</script>


<details data-card="radius-2 padding-2">
	<summary data-row="gap-2 align-center">
		<code>#{event.logIndex}</code>
		<span>{event.address}</span>
		<span>{event.transactionHash.slice(0, 18)}…</span>
	</summary>
	<dl data-column="gap-1">
		<dt>Address</dt>
		<dd><code>{event.address}</code></dd>
		<dt>Topics</dt>
		<dd><code>{event.topics.length}</code></dd>
		{#if event.data !== '0x'}
			<dt>Data</dt>
			<dd>
				<code>{event.data.slice(0, 66)}{event.data.length > 66 ? '…' : ''}</code
				>
			</dd>
		{/if}
	</dl>
</details>
