<script lang="ts">
	import { goto } from '$app/navigation'
	import { createAgentChatTree } from '$/lib/agent-chat.ts'

	let started = $state(false)
	$effect(() => {
		if (started) return
		started = true
		const tree = createAgentChatTree()
		goto(`/agents/${tree.id}`, { replaceState: true })
	})
</script>


<p data-muted>Starting new conversation…</p>
