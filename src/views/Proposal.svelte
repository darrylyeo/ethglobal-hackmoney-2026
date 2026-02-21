<script lang="ts">
	// Types/constants
	import type { ProposalEntry } from '$/data/ProposalEntry.ts'


	// Props
	let { entry }: { entry: ProposalEntry } = $props()
</script>

<p>
	<a
		href={entry.url}
		target="_blank"
		rel="noopener noreferrer"
		data-link
	>
		View on eips.ethereum.org
	</a>
</p>
