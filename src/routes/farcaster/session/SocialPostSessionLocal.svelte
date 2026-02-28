<script lang="ts">
	// Types/constants
	import type { FarcasterConnectionSiwf } from '$/data/FarcasterConnection.ts'
	import type { SocialPostSession } from '$/data/SocialPostSession.ts'
	import { useFarcasterConnections } from '$/collections/FarcasterConnections.ts'
	import {
		createSocialPostSession,
		socialPostSessionsCollection,
	} from '$/collections/SocialPostSessions.ts'
	import {
		SocialPostActionType,
		SocialProtocol,
	} from '$/constants/social-post-actions.ts'
	import { FarcasterConnectionTransport } from '$/data/FarcasterConnection.ts'


	// Context
	import { replaceState } from '$app/navigation'

	const connectionsQuery = useFarcasterConnections()


	// Props
	let {
		initialSession,
		setPanelRoute,
	}: {
		initialSession: SocialPostSession
		setPanelRoute?: (path: string, params: Record<string, string>) => void
	} = $props()


	// State
	// svelte-ignore state_referenced_locally
	let activeSession = $state<SocialPostSession>(structuredClone(initialSession))

	// (Derived)
	const isEphemeral = $derived(
		activeSession.$id.id.startsWith('ephemeral-')
	)
	const selectedSiwfConnection = $derived(
		((connectionsQuery.data ?? []) as { row: FarcasterConnectionSiwf }[])
			.map(({ row }) => row)
			.find((c) => c.transport === FarcasterConnectionTransport.Siwf && c.selected)
		?? null
	)


	// Actions
	$effect(() => {
		const authorId = selectedSiwfConnection?.$id.fid ?? 0
		if (authorId > 0 && activeSession.authorId !== authorId) {
			activeSession = { ...activeSession, authorId }
		}
	})
	const persistSession = () => {
		if (!isEphemeral) return
		const session = createSocialPostSession(
			activeSession.actions[0]?.type ?? SocialPostActionType.CreatePost,
			SocialProtocol.Farcaster,
			selectedSiwfConnection?.$id.fid ?? activeSession.authorId ?? 0,
			activeSession.actions[0]?.params as Record<string, unknown>,
		)
		socialPostSessionsCollection.insert(session)
		if (setPanelRoute) {
			setPanelRoute('/farcaster/session/[id]', { id: session.$id.id })
		} else {
			replaceState(`/farcaster/session/${session.$id.id}`, {})
		}
	}


	// Components
	import SocialPostSessionView from './SocialPostSession.svelte'
</script>


<SocialPostSessionView
	bind:session={activeSession}
	{selectedSiwfConnection}
	onPersist={isEphemeral
		? persistSession
		: undefined}
/>
