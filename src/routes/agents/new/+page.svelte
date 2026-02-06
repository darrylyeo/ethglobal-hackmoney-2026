<script lang="ts">
	import { goto } from '$app/navigation'
	import { createDialogueTree } from '$/lib/dialogue'

	let started = $state(false)
	$effect(() => {
		if (started) return
		started = true
		const tree = createDialogueTree()
		goto(`/agents/${tree.id}`, { replaceState: true })
	})
</script>


<p data-muted>Starting new conversation…</p>
