<script lang="ts">
	// Types/constants
	import type { Eip8004Agent } from '$/data/Eip8004Agent.ts'
	import { eip8004AgentIdToString } from '$/data/Eip8004Agent.ts'

	// Props
	let { agent }: { agent: Eip8004Agent } = $props()

	// (Derived)
	const agentsRef = $derived(`@Agent:${agent.identityId}`)
	const agentsHref = $derived(
		`/agents?ref=${encodeURIComponent(eip8004AgentIdToString({ chainId: agent.chainId, identityId: agent.identityId }))}`,
	)
</script>

<div data-column="gap-2">
	{#if agent.description}
		<p>{agent.description}</p>
	{/if}
	{#if agent.contactEndpoint}
		<p>
			<strong>Contact:</strong>
			<a
				href={agent.contactEndpoint}
				target="_blank"
				rel="noopener noreferrer"
				data-link
			>
				{agent.contactEndpoint}
			</a>
		</p>
	{/if}
	<p>
		<a href={agentsHref} data-link>
			Use in chat
		</a>
		— reference as {agentsRef} in agent conversations.
	</p>
</div>
