<script lang="ts">
	// Types/constants
	import type { CaipEntry } from '$/data/CaipEntry.ts'

	// Props
	let { entry }: { entry: CaipEntry } = $props()
</script>

<p>
	<a
		href={entry.url}
		target="_blank"
		rel="noopener noreferrer"
		data-link
	>
		View on chainagnostic.org
	</a>
</p>
