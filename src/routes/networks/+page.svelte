<script lang="ts">
	// Types/constants
	import { resolve } from '$app/paths'
	import { EntityType } from '$/data/$EntityType.ts'
	import { networks } from '$/constants/networks.ts'

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
		{#each networks as network (network.chainId)}
			<li data-row="start gap-2 align-center">
				<EntityId
					link={resolve(`/network/${network.slug}`)}
					draggableText={network.name}
					className=""
					entityType={EntityType.Network}
					entityId={{ chainId: network.chainId }}
				>
					<NetworkName chainId={network.chainId} />
				</EntityId>
				<WatchButton
					entityType={EntityType.Network}
					entityId={{ chainId: network.chainId }}
				/>
			</li>
		{/each}
	</ul>
</main>
