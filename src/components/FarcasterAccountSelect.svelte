<script lang="ts">
	// Types/constants
	import type { FarcasterConnectionSiwf } from '$/data/FarcasterConnection.ts'
	import {
		selectFarcasterConnection,
		useFarcasterConnections,
	} from '$/collections/FarcasterConnections.ts'
	import { FarcasterConnectionTransport } from '$/data/FarcasterConnection.ts'


	// Context
	const connectionsQuery = useFarcasterConnections()

	// (Derived)
	const siwfConnections = $derived(
		(
			(connectionsQuery.data ?? [])
				.map(({ farcasterConnection: connection }) => connection)
				.filter((c) => c.transport === FarcasterConnectionTransport.Siwf)
				.sort((a, b) => b.connectedAt - a.connectedAt)
		),
	)
	const selectedConnection = $derived(
		siwfConnections.find((c) => c.selected) ?? siwfConnections[0],
	)


	// Actions
	const selectFid = (fid: number) => {
		selectFarcasterConnection(fid)
	}


	// Components
	import Dropdown from '$/components/Dropdown.svelte'
</script>

{#if siwfConnections.length > 0}
	<Dropdown
		items={siwfConnections.map((c) => ({
			type: 'item' as const,
			item: c,
			id: `fid-${c.$id.fid}`,
			label: c.username ? `@${c.username}` : `@${c.$id.fid}`,
			onSelect: () => selectFid(c.$id.fid),
		}))}
		triggerLabel={
			selectedConnection ?
				(
					selectedConnection.username ?
						`@${selectedConnection.username}`
					: `@${selectedConnection.$id.fid}`
				)
			: 'Select account'
		}
		triggerAriaLabel="Select Farcaster account"
		triggerProps={{
			'data-row': 'gap-2 align-center',
		}}
	>
		{#snippet children()}
			{#if selectedConnection?.pfpUrl}
				<img
					src={selectedConnection.pfpUrl}
					alt=""
					width="24"
					height="24"
					style="border-radius: 50%"
				/>
			{/if}
		{/snippet}
	</Dropdown>
{:else}
	<p data-text="muted">
		<a href="/farcaster/accounts">Sign in with Farcaster</a> to draft posts.
	</p>
{/if}
