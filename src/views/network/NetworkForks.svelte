<script lang="ts">
	// Types/constants
	import { ChainId } from '$/constants/networks.ts'
	import { FORK_SCHEDULE_BY_CHAIN_ID } from '$/constants/fork-schedules.ts'


	// Props
	let {
		chainId,
		nameParam,
		forksHref,
		detailsProps = {},
	}: {
		chainId?: number
		nameParam?: string
		forksHref?: string
		detailsProps?: Record<string, unknown>
	} = $props()


	// (Derived)
	const scheduleForks = $derived(
		chainId != null ? FORK_SCHEDULE_BY_CHAIN_ID[chainId]?.forks ?? null : null,
	)
	const showForkList = $derived(
		chainId === ChainId.Ethereum ||
			(scheduleForks != null && scheduleForks.length > 0),
	)
	const embedSchedule = $derived(
		chainId != null && nameParam != null && showForkList,
	)


	// Components
	import NetworkForkSchedule from '$/views/network/NetworkForkSchedule.svelte'
</script>

{#if embedSchedule && chainId != null && nameParam != null}
	<details open {...detailsProps}>
		<summary>Forks</summary>
		<NetworkForkSchedule
			chainId={chainId}
			nameParam={nameParam}
			detailsProps={detailsProps}
		/>
	</details>
{:else if forksHref}
	<details open {...detailsProps}>
		<summary>Forks</summary>
		<p>
			<a href={forksHref} data-link>View fork schedule</a>
		</p>
	</details>
{/if}
