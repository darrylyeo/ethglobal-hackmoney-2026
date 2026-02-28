<script lang="ts">
	// Types/constants
	import type { EvmTopic } from '$/data/EvmTopic.ts'

	// Props
	let { entry }: { entry: EvmTopic } = $props()
</script>


<section>
	<dl data-definition-list="vertical">
		<div>
			<dt>Hex (32-byte)</dt>
			<dd><code>{entry.$id.hex}</code></dd>
		</div>

		<div>
			<dt>Signatures</dt>
			<dd>
				{#if entry.signatures.length > 0}
					<ul role="list">
						{#each entry.signatures as sig}
							<li><code>{sig}</code></li>
						{/each}
					</ul>
				{:else}
					—
				{/if}
			</dd>
		</div>
	</dl>
</section>
