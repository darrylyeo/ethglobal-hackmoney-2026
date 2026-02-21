<script lang="ts">
	// Types/constants
	import { networks } from '$/constants/networks.ts'
	import { EntityType } from '$/data/$EntityType.ts'


	// Context
	import { resolve } from '$app/paths'


	// Components
	import EntityId from '$/components/EntityId.svelte'
	import WatchButton from '$/components/WatchButton.svelte'
	import NetworkName from '$/views/NetworkName.svelte'
</script>


<svelte:head>
	<title>Networks</title>
</svelte:head>


<main data-column="gap-2">
	<section data-column="gap-2">
		<h1><a href={resolve('/networks')}>Networks</a></h1>
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
	</section>
</main>
