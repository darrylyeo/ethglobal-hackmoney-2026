<script lang="ts">
	// Types/constants
	import type { FarcasterConnectionSiwf } from '$/data/FarcasterConnection.ts'
	import type { SocialPostSession } from '$/data/SocialPostSession.ts'
	import { FarcasterConnectionTransport } from '$/data/FarcasterConnection.ts'
	import { EntityType } from '$/data/$EntityType.ts'
	import {
		buildSocialPostSessionPath,
		formatSocialPostSessionPlaceholderName,
	} from '$/lib/session/socialPostSessionUrl.ts'
	import { stringify } from 'devalue'


	// Context
	import { resolve } from '$app/paths'


	// Props
	let {
		onPersist,
		session = $bindable(),
		selectedSiwfConnection,
	}: {
		onPersist?: () => void
		session: SocialPostSession
		selectedSiwfConnection: FarcasterConnectionSiwf | null
	} = $props()


	// State
	let initialSnapshot = $state<string | null>(null)
	let persisted = $state(
		false
	)

	// (Derived)
	const canDraft = $derived(
		selectedSiwfConnection?.transport === FarcasterConnectionTransport.Siwf
	)
	const placeholderName = $derived(
		formatSocialPostSessionPlaceholderName(session.actions)
	)


	// Actions
	$effect(() => {
		if (persisted || !onPersist) return
		const snapshot = stringify({
			actions: session.actions,
			params: session.params,
			name: session.name,
		})
		if (initialSnapshot === null) {
			initialSnapshot = snapshot
			return
		}
		if (snapshot !== initialSnapshot) {
			persisted = true
			onPersist()
		}
	})


	// Components
	import EntityView from '$/components/EntityView.svelte'
	import FarcasterAccountSelect from '$/components/FarcasterAccountSelect.svelte'
	import SocialPostActionsSequence from './SocialPostActionsSequence.svelte'
</script>


<div data-social-post-session data-column="gap-4" data-sticky-container>
	<EntityView
		data-scroll-item
		entityType={EntityType.SocialPostSession}
		entity={session}
		titleHref={false}
		label={session.name ?? placeholderName}
		annotation="Social post"
	>
		{#snippet Title()}
			<span class="sr-only">Social post</span>

			<input
				type="text"
				class="session-name-input"
				bind:value={session.name}
				placeholder={placeholderName}
				aria-label="Social post name"
				disabled={!canDraft}
			/>
		{/snippet}

		<details open data-card>
			<summary>
				<header data-row="wrap">
					<FarcasterAccountSelect />
				</header>
			</summary>
		</details>
	</EntityView>

	{#if canDraft}
		<section data-scroll-item data-column="gap-4">
			<SocialPostActionsSequence bind:actions={session.actions} />
		</section>
	{:else}
		<p data-text="muted">Sign in with Farcaster to draft posts.</p>
	{/if}
</div>


<style>
	.session-name-input:placeholder-shown:not(:focus) {
		border: none;
		background: transparent;
		padding: 0;
		box-shadow: none;
		outline: none;
	}

	.session-name-input:placeholder-shown:not(:focus)::placeholder {
		color: inherit;
	}
</style>
