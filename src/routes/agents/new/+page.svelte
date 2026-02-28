<script lang="ts">
	// Context
	import { goto } from '$app/navigation'


	// Functions
	import { createAgentChatTree } from '$/lib/agentChat.ts'


	// State
	let started = $state(
		false
	)
	$effect(() => {
		if (started) return
		started = true
		const tree = createAgentChatTree()
		goto(`/agents/${tree.id}`, { replaceState: true })
	})
</script>


<main>
	<p data-text="muted">Starting new conversation…</p>
</main>
