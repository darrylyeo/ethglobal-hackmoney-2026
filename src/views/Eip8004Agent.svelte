<script lang="ts">
	// Types/constants
	import type { Eip8004Agent } from '$/data/Eip8004Agent.ts'
	import { eip8004AgentIdToString } from '$/data/Eip8004Agent.ts'
	import { ipfsUriToHttp } from '$/api/eip-8004.ts'

	// Props
	let { agent }: { agent: Eip8004Agent } = $props()

	// (Derived)
	const agentsRef = $derived(`@Agent:${agent.$id.identityId}`)
	const agentsHref = $derived(
		`/agents?ref=${encodeURIComponent(eip8004AgentIdToString(agent.$id))}`,
	)
	const imageSrc = $derived(agent.image ? ipfsUriToHttp(agent.image) : null)
	const hasServices = $derived(agent.services != null && agent.services.length > 0)
</script>

<div data-column="gap-3">
	{#if imageSrc}
		<p>
			<img
				src={imageSrc}
				alt=""
				width="64"
				height="64"
				style="border-radius: 50%; object-fit: cover;"
			/>
		</p>
	{/if}
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
	{#if hasServices}
		<dl data-definition-list="vertical">
			<dt>Services</dt>
			<dd>
				<ul role="list" data-column="gap-0.5">
					{#each agent.services! as svc}
						<li>
							{svc.name ?? svc.type}
							{#if svc.url}
								—
								<a
									href={svc.url.startsWith('http') ? svc.url : ipfsUriToHttp(svc.url)}
									target="_blank"
									rel="noopener noreferrer"
									data-link
								>
									{svc.url}
								</a>
							{/if}
						</li>
					{/each}
				</ul>
			</dd>
		</dl>
	{/if}
	{#if agent.registrationUri}
		<p>
			<a
				href={agent.registrationUri.startsWith('http') ? agent.registrationUri : ipfsUriToHttp(agent.registrationUri)}
				target="_blank"
				rel="noopener noreferrer"
				data-link
			>
				View registration document
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
