<script lang="ts">
	// Types/constants
	import { APP_NAME } from '$/constants/app.ts'


	// Context
	import { replaceState } from '$app/navigation'
	import { page } from '$app/state'
	import { setContext } from 'svelte'


	// Props
	let {
		panelHash,
		setPanelHash,
		setPanelRoute,
	}: {
		panelHash?: string | null
		setPanelHash?: (hash: string, replace?: boolean) => void
		setPanelRoute?: (path: string, params: Record<string, string>) => void
	} = $props()


	// Functions
	import {
		SessionTemplateId,
		sessionTemplatesById,
		type Session,
	} from '$/data/Session.ts'
	import { formatSessionPlaceholderName } from '$/lib/session/sessions.ts'
	import {
		SESSION_HASH_SOURCE_KEY,
		type SessionHashSource,
	} from '$/lib/session/panelHash.ts'
	import { ActionType } from '$/constants/actions.ts'
	import { createAction } from '$/lib/actions.ts'
	import {
		buildSessionPath,
		createSession,
		parseSessionHash,
		parseTemplateParam,
		sessionFromParsedHash,
	} from '$/lib/session/sessions.ts'


	// State
	const hashSource = $state<SessionHashSource>({
		enabled: false,
		panelHash: null,
		setPanelHash: () => {},
		setPanelRoute: undefined,
	})
	$effect(() => {
		if (typeof setPanelHash === 'function') {
			hashSource.enabled = true
			hashSource.panelHash = panelHash ?? null
			hashSource.setPanelHash = setPanelHash
			hashSource.setPanelRoute = setPanelRoute
			return
		}
		hashSource.enabled = false
		hashSource.panelHash = null
		hashSource.setPanelHash = () => {}
		hashSource.setPanelRoute = undefined
	})
	setContext(SESSION_HASH_SOURCE_KEY, hashSource)

	let activeSession = $state<Session | null>(null)
	let lastEphemeralHash = $state<string | null>(null)


	// (Derived)
	const effectiveHash = $derived(
		hashSource.enabled ? (hashSource.panelHash ?? '') : page.url.hash,
	)
	const templateParam = $derived(page.url.searchParams.get('template'))
	const parsedHash = $derived(
		templateParam && templateParam.length > 0
			? parseTemplateParam(templateParam)
			: parseSessionHash(effectiveHash),
	)

	const effectiveEphemeralKey = $derived(templateParam ?? effectiveHash)
	$effect(() => {
		if (
			(parsedHash.kind === 'actions' || parsedHash.kind === 'empty') &&
			effectiveEphemeralKey !== lastEphemeralHash
		) {
			const base = sessionFromParsedHash(parsedHash)
			const templateId = templateParam as SessionTemplateId | undefined
			const template = templateId && sessionTemplatesById[templateId]
			const templateActions = template
				? template.actions.map((a) => ({
						...a,
						params: { ...a.params },
					}))
				: null
			const actionsToUse =
				(templateActions ?? base.actions).length > 0
					? (templateActions ?? base.actions)
					: [createAction(ActionType.Swap)]
			activeSession = { ...base, actions: actionsToUse }
			lastEphemeralHash = effectiveEphemeralKey
		}
	})

	const isEphemeral = $derived(
		parsedHash.kind === 'actions' || parsedHash.kind === 'empty',
	)

	const persistEphemeralSession = () => {
		if (!activeSession || !activeSession.id.startsWith('ephemeral-')) return
		const created = createSession({
			actions: activeSession.actions,
			name: activeSession.name,
			params: activeSession.params,
		})
		if (hashSource.setPanelRoute) {
			hashSource.setPanelRoute('/session/[id]', { id: created.id })
			hashSource.setPanelHash('')
		} else {
			replaceState(buildSessionPath(created.id), {})
		}
	}

	const pageTitle = $derived(
		activeSession
			? (activeSession.name ?? formatSessionPlaceholderName(activeSession.actions))
			: 'Session',
	)


	// Components
	import SessionView from './Session.svelte'
</script>


<svelte:head>
	<title>{pageTitle} – {APP_NAME}</title>
</svelte:head>


<main
	id="main"
	data-column
	data-sticky-container
>
	{#if activeSession}
		<SessionView
			bind:session={activeSession}
			onPersist={isEphemeral ? persistEphemeralSession : undefined}
		/>
	{:else}
		<section
			data-scroll-item
			data-column="gap-3"
		>
			<header data-row="wrap gap-4">
				<div data-row="start gap-2" data-row-item="flexible">
					<h1>Session</h1>
				</div>
				<div data-row="gap-2">
					<span data-text="annotation">Session</span>
				</div>
			</header>
			<p data-text="muted">Loading session…</p>
		</section>
	{/if}
</main>
