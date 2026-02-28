<script lang="ts">
	// Types/constants
	import type { FarcasterConnectionRow } from '$/data/FarcasterConnection.ts'


	// Props
	let {
		connection,
		actionLabel,
		onAction,
	}: {
		connection: FarcasterConnectionRow
		actionLabel: string
		onAction: () => void
	} = $props()

	// (Derived)
	const label = $derived(
		connection.username ? `@${connection.username}` : `@${connection.$id.fid}`,
	)


	// Components
	import { Button } from 'bits-ui'
</script>


<div data-card="padding-2 radius-3" data-row="align-center wrap">
	<a
		href="/farcaster/user/{connection.$id.fid}"
		data-row="align-center"
		data-link="camouflaged"
	>
		{#if connection.pfpUrl}
			<img
				src={connection.pfpUrl}
				alt=""
				width="32"
				height="32"
				style="border-radius: 50%"
			/>
		{/if}
		<span>{label}</span>
	</a>
	<Button.Root type="button" onclick={onAction}>
		{actionLabel}
	</Button.Root>
</div>

