<script lang="ts">
	// Types/constants
	import { EntityType } from '$/data/$EntityType.ts'
	import type { Eip8004Agent } from '$/data/Eip8004Agent.ts'
	import {
		eip8004AgentIdFromString,
		eip8004AgentIdToString,
	} from '$/data/Eip8004Agent.ts'
	import { fetchEip8004Agent } from '$/api/eip-8004.ts'
	import { eip8004AgentsCollection } from '$/collections/Eip8004Agents.ts'
	import { networksByChainId } from '$/constants/networks.ts'

	// Context
	import { page } from '$app/state'
	import { resolve } from '$app/paths'

	// (Derived)
	const idParam = $derived(page.params.id ?? '')
	const parsedId = $derived(
		idParam ? eip8004AgentIdFromString(decodeURIComponent(idParam)) : null,
	)
	const key = $derived(
		parsedId ? eip8004AgentIdToString(parsedId) : null,
	)
	const agentFromCollection = $derived(
		key ? (eip8004AgentsCollection.state.get(key) as Eip8004Agent | undefined) : undefined,
	)

	// State
	let agentOverride = $state<Eip8004Agent | null>(null)
	let loadError = $state<string | null>(null)

	// (Derived)
	const agent = $derived(agentFromCollection ?? agentOverride)

	// Effects
	$effect(() => {
		if (!parsedId || agentFromCollection) return
		loadError = null
		fetchEip8004Agent(parsedId)
			.then((a) => {
				agentOverride = a
			})
			.catch((e) => {
				loadError = e instanceof Error ? e.message : String(e)
			})
	})

	const label = $derived(
		agent ? (agent.name ?? agent.$id.identityId) : idParam || 'Agent',
	)
	const metadata = $derived(
		agent
			? [
					{ term: 'Identity', detail: agent.$id.identityId },
					{
						term: 'Chain',
						detail: networksByChainId[agent.$id.chainId]?.name ?? String(agent.$id.chainId),
					},
					...(agent.contactEndpoint
						? [{ term: 'Contact', detail: agent.contactEndpoint }]
						: []),
				]
			: [],
	)

	// Components
	import EntityView from '$/components/EntityView.svelte'
	import Eip8004AgentView from '$/views/Eip8004Agent.svelte'
</script>

<svelte:head>
	<title>
		{agent ? (agent.name ?? agent.$id.identityId) : 'Agent'}
		– EIP-8004 registry
	</title>
</svelte:head>

<main>
	{#if !parsedId}
		<h1>Invalid agent id</h1>
		<p>Could not parse agent id from "{idParam}".</p>
	{:else if loadError}
		<h1>Error</h1>
		<p>{loadError}</p>
	{:else if agent}
		<EntityView
			entityType={EntityType.Eip8004Agent}
			entity={agent}
			titleHref={resolve(`/agents/registry/${encodeURIComponent(idParam)}`)}
			{label}
			{metadata}
		>
			<svelte:fragment slot="children">
				<Eip8004AgentView {agent} />
			</svelte:fragment>
		</EntityView>
	{:else}
		<p>Loading…</p>
	{/if}
</main>
