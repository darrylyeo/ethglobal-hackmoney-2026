<script lang="ts">
	import { ensureProposalsSync } from '$/collections/Proposals.ts'

	let { children } = $props()

	$effect(() => {
		ensureProposalsSync().catch(() => {})
	})
</script>

{@render children()}
