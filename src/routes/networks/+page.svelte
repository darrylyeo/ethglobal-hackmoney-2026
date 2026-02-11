<script lang="ts">
	// Types/constants
	import { resolve } from '$app/paths'
	import { EntityType } from '$/data/$EntityType.ts'
	import { networkConfigs, toNetworkSlug } from '$/constants/networks.ts'

	// Components
	import EntityId from '$/components/EntityId.svelte'
	import WatchButton from '$/components/WatchButton.svelte'
	import NetworkName from '$/views/NetworkName.svelte'
</script>


<svelte:head>
	<title>Networks</title>
</svelte:head>


<main data-column="gap-2">
	<h1>Networks</h1>
	<ul data-column="gap-2">
		{#each networkConfigs as config (config.chainId)}
			{@const slug = toNetworkSlug(config.name)}
			<li data-row="start gap-2 align-center">
				<EntityId
					link={resolve(`/network/${slug}`)}
					draggableText={config.name}
					className=""
					entityType={EntityType.Network}
					entityId={{ chainId: config.chainId }}
				>
					<NetworkName chainId={config.chainId} />
				</EntityId>
				<WatchButton
					entityType={EntityType.Network}
					id={slug}
					label={config.name}
					href={resolve(`/network/${slug}`)}
				/>
			</li>
		{/each}
	</ul>
</main>
