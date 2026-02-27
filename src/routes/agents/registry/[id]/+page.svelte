<script lang="ts">
	// Types/constants
	import { EntityType } from '$/data/$EntityType.ts'
	import type { Eip8004Service } from '$/data/Eip8004Service.ts'
	import {
		eip8004ServiceIdFromString,
		eip8004ServiceIdToString,
	} from '$/data/Eip8004Service.ts'
	import { fetchEip8004Service } from '$/api/eip-8004.ts'
	import { eip8004ServicesCollection } from '$/collections/Eip8004Services.ts'
	import { networksByChainId } from '$/constants/networks.ts'

	// Context
	import { page } from '$app/state'
	import { resolve } from '$app/paths'

	// (Derived)
	const idParam = $derived(page.params.id ?? '')
	const parsedId = $derived(
		idParam ? eip8004ServiceIdFromString(decodeURIComponent(idParam)) : null,
	)
	const key = $derived(
		parsedId ? eip8004ServiceIdToString(parsedId) : null,
	)
	const serviceFromCollection = $derived(
		key ? (eip8004ServicesCollection.state.get(key) as Eip8004Service | undefined) : undefined,
	)

	// State
	let serviceOverride = $state<Eip8004Service | null>(null)
	let loadError = $state<string | null>(null)

	// (Derived)
	const service = $derived(serviceFromCollection ?? serviceOverride)

	// Effects
	$effect(() => {
		if (!parsedId || serviceFromCollection) return
		loadError = null
		fetchEip8004Service(parsedId)
			.then((s) => {
				serviceOverride = s
			})
			.catch((e) => {
				loadError = e instanceof Error ? e.message : String(e)
			})
	})

	const label = $derived(
		service ? (service.name ?? service.$id.identityId) : idParam || 'Service',
	)
	const metadata = $derived(
		service
			? [
					{ term: 'Identity', detail: service.$id.identityId },
					{
						term: 'Chain',
						detail: networksByChainId[service.$id.chainId]?.name ?? String(service.$id.chainId),
					},
					...(service.contactEndpoint
						? [{ term: 'Contact', detail: service.contactEndpoint }]
						: []),
				]
			: [],
	)

	// Components
	import EntityView from '$/components/EntityView.svelte'
	import Eip8004ServiceView from '$/views/Eip8004Service.svelte'
</script>

<svelte:head>
	<title>
		{service ? (service.name ?? service.$id.identityId) : 'Service'}
		– EIP-8004 registry
	</title>
</svelte:head>

<main>
	{#if !parsedId}
		<h1>Invalid service id</h1>
		<p>Could not parse service id from "{idParam}".</p>
	{:else if loadError}
		<h1>Error</h1>
		<p>{loadError}</p>
	{:else if service}
		<EntityView
			entityType={EntityType.Eip8004Service}
			entity={service}
			titleHref={resolve(`/agents/registry/${encodeURIComponent(idParam)}`)}
			{label}
			{metadata}
		>
			<svelte:fragment slot="children">
				<Eip8004ServiceView {service} />
			</svelte:fragment>
		</EntityView>
	{:else}
		<p>Loading…</p>
	{/if}
</main>
