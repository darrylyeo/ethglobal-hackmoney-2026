<script lang="ts">
	// Types/constants
	import type { SocialPostSession } from '$/data/SocialPostSession.ts'
	import type { FarcasterConnectionSiwf } from '$/data/FarcasterConnection.ts'
	import { FarcasterConnectionTransport } from '$/data/FarcasterConnection.ts'
	import { replaceState } from '$app/navigation'
	import {
		createSocialPostSession,
		socialPostSessionsCollection,
	} from '$/collections/SocialPostSessions.ts'
	import {
		SocialPostActionType,
		SocialProtocol,
	} from '$/constants/social-post-actions.ts'
	import { useFarcasterConnections } from '$/collections/FarcasterConnections.ts'

	// Props
	let {
		initialSession,
		setPanelRoute,
	}: {
		initialSession: SocialPostSession
		setPanelRoute?: (path: string, params: Record<string, string>) => void
	} = $props()

	// State — {#key urlKey} remounts on input change, so initialSession is stable
	// svelte-ignore state_referenced_locally — intentional: we only seed from initial
	let activeSession = $state<SocialPostSession>(structuredClone(initialSession))

	// (Derived)
	const connectionsQuery = useFarcasterConnections()
	const selectedSiwfConnection = $derived(
		((connectionsQuery.data ?? []) as { row: FarcasterConnectionSiwf }[])
			.map((r) => r.row)
			.find(
				(c) =>
					c.transport === FarcasterConnectionTransport.Siwf && c.selected,
			) ?? null,
	)
	const isEphemeral = $derived(activeSession.id.startsWith('ephemeral-'))

	$effect(() => {
		const authorId = selectedSiwfConnection?.$id.fid ?? 0
		if (authorId > 0 && activeSession.authorId !== authorId) {
			activeSession = { ...activeSession, authorId }
		}
	})

	const persistSession = () => {
		if (!isEphemeral) return
		const authorId = selectedSiwfConnection?.$id.fid ?? activeSession.authorId ?? 0
		const row = createSocialPostSession(
			activeSession.actions[0]?.type ?? SocialPostActionType.CreatePost,
			SocialProtocol.Farcaster,
			authorId,
			activeSession.actions[0]?.params as Record<string, unknown>,
		)
		socialPostSessionsCollection.insert(row)
		if (setPanelRoute) {
			setPanelRoute('/farcaster/session/[id]', { id: row.id })
		} else {
			replaceState(`/farcaster/session/${row.id}`, {})
		}
	}

	// Components
	import SocialPostSessionView from './SocialPostSession.svelte'
</script>

<SocialPostSessionView
	bind:session={activeSession}
	{selectedSiwfConnection}
	onPersist={isEphemeral ? persistSession : undefined}
/>
