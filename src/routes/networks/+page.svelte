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


<main data-column>
	<section data-column>
		<h1><a href={resolve('/networks')}>Networks</a></h1>
		<ul data-column>
		{#each networks as network (network.chainId)}
			<li data-row="start align-center">
				<EntityId
					link={resolve(`/network/${network.chainId}`)}
					draggableText={network.name}
					className=""
					entityType={EntityType.Network}
					entityId={{ chainId: network.chainId }}
				>
					<NetworkName networkId={{ chainId: network.chainId }} />
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
