<script lang="ts">


	// Types/constants
	import type { DialogueTree } from '$/data/DialogueTree'
	import type { DialogueTurn } from '$/data/DialogueTurn'


	// Props
	let {
		turn,
		allTurns,
		tree,
	}: {
		turn: DialogueTurn
		allTurns: DialogueTurn[]
		tree: DialogueTree
	} = $props()


	// (Derived)
	const children = $derived(
		allTurns.filter((t) => t.parentId === turn.id),
	)

	type TabItem =
		| { id: string, label: string, type: 'child', child: DialogueTurn }
		| { id: string, label: string, type: 'reply' }

	const tabItems = $derived.by((): TabItem[] => {
		const items: TabItem[] = children.map((c, i) => ({
			id: c.id,
			label: c.userPrompt.slice(0, 30) || `Branch ${i + 1}`,
			type: 'child' as const,
			child: c,
		}))
		if (showPromptForm)
			items.push({ id: 'reply', label: 'Reply', type: 'reply' })
		return items
	})

	const useTabs = $derived(tabItems.length > 1)


	// Context
	import { page } from '$app/stores'


	// Functions
	import {
		collectDialogueTurnDescendantIds,
		deleteDialogueTurn,
		retryDialogueTurn,
		submitDialogueTurn,
	} from '$/lib/dialogue'
	import { goto } from '$app/navigation'

	const handleDelete = () => {
		const ids = collectDialogueTurnDescendantIds(turn.id, allTurns)
		const currentHash = $page.url.hash
		const hashWasDeleted = [...ids].some((id) => currentHash === `#turn:${id}`)
		deleteDialogueTurn(turn.id, allTurns)
		if (hashWasDeleted && turn.parentId)
			goto(`${$page.url.pathname}#turn:${turn.parentId}`, { replaceState: true })
		else if (hashWasDeleted)
			goto($page.url.pathname, { replaceState: true })
	}

	const handleSubmit = async (value: string, entityRefs: import('$/data/EntityRef').EntityRef[]) => {
		const turnId = await submitDialogueTurn({
			treeId: tree.id,
			parentId: turn.id,
			userPrompt: value,
			entityRefs,
			systemPrompt: tree.systemPrompt,
		})
		goto(`${$page.url.pathname}#turn:${turnId}`, { replaceState: true })
	}


	// State
	let promptValue = $state('')
	let activeTab = $state('')

	const isTarget = $derived($page.url.hash === `#turn:${turn.id}`)

	$effect(() => {
		if (!useTabs) return
		const hash = $page.url.hash
		if (hash === `#turn:${turn.id}` && showPromptForm)
			activeTab = 'reply'
		else if (hash?.startsWith('#turn:')) {
			const turnId = hash.slice(6)
			if (tabItems.some((t) => t.id === turnId))
				activeTab = turnId
		}
	})

	$effect(() => {
		if (useTabs && !activeTab && tabItems.length > 0)
			activeTab = tabItems[0].id
	})
	const showPromptForm = $derived(
		(turn.status === 'complete' || turn.status === 'error')
			&& (isTarget || promptValue.trim() !== ''),
	)

	const handleRetry = () => {
		retryDialogueTurn({
			turnId: turn.id,
			allTurns,
			systemPrompt: tree.systemPrompt,
		})
	}


	// Components
	import Tabs from '$/components/Tabs.svelte'
	import DialogueTurnNode from '$/components/agent/DialogueTurnNode.svelte'
	import EntityRefInput from '$/components/EntityRefInput.svelte'


	// Transitions/animations
	import { flip } from 'svelte/animate'
	import { expoOut } from 'svelte/easing'
</script>


<section
	data-status={turn.status}
	data-column="gap-2"
	id="turn:{turn.id}"
	class="turn-card"
>
	{#if (turn.status === 'complete' || turn.status === 'error') && !showPromptForm}
		<a href="#turn:{turn.id}" class="turn-card-reply"><span class="sr-only">Reply</span></a>
	{/if}

	<div data-row="gap-2 align-center justify-between">
		<div data-column="gap-1" data-row-item="flexible">
			<strong>User</strong>
			<p>{turn.userPrompt}</p>
		</div>
		<button type="button" onclick={handleDelete}>Delete</button>
	</div>

	{#if turn.status === 'generating'}
		<p data-muted>Generating…</p>
	{:else if turn.status === 'error'}
		<div data-row="gap-2 align-center">
			<p data-error>{turn.error ?? 'Generation failed.'}</p>
			<button type="button" onclick={handleRetry}>Retry</button>
		</div>
	{:else if turn.status === 'cancelled'}
		<p data-muted>Cancelled.</p>
	{:else if turn.assistantText}
		<div data-column="gap-1">
			<strong>Assistant</strong>
			<p>{turn.assistantText}</p>
			<small data-muted>
				{turn.providerId ?? 'unknown'} · {new Date(turn.createdAt).toISOString()}
			</small>
		</div>
	{/if}

	{#if useTabs}
		<Tabs
			tabs={tabItems}
			bind:value={activeTab}
		>
			{#snippet content(item)}
				{#if item.type === 'reply'}
					<EntityRefInput
						bind:value={promptValue}
						disabled={turn.status === 'error'}
						autofocus={isTarget}
						onsubmit={(value, entityRefs) => {
							handleSubmit(value, entityRefs)
							promptValue = ''
						}}
						placeholder="Continue the conversation…"
					/>
				{:else}
					<DialogueTurnNode
						turn={item.child}
						{allTurns}
						{tree}
					/>
				{/if}
			{/snippet}
		</Tabs>
	{:else if children.length > 0}
		<div data-column="gap-2">
			{#each children as child (child.id)}
				<div animate:flip={{ duration: 250, easing: expoOut }}>
					<DialogueTurnNode
						turn={child}
						{allTurns}
						{tree}
					/>
				</div>
			{/each}
		</div>
	{:else if showPromptForm}
		<EntityRefInput
			bind:value={promptValue}
			disabled={turn.status === 'error'}
			autofocus={isTarget}
			onsubmit={(value, entityRefs) => {
				handleSubmit(value, entityRefs)
				promptValue = ''
			}}
			placeholder="Continue the conversation…"
		/>
	{/if}
</section>


<style>
	.turn-card {
		position: relative;
		padding: 0.75em;
		border: 1px solid var(--color-border);
		border-radius: 0.5em;

		&[data-status='generating'] {
			opacity: 0.7;
			animation: pulse 1.5s ease-in-out infinite;
		}

		&[data-status='error'] {
			border-color: var(--color-error, #e53e3e);
		}
	}

	.turn-card-reply {
		position: absolute;
		inset: 0;
	}

	@keyframes pulse {
		0%, 100% { opacity: 0.7; }
		50% { opacity: 1; }
	}
</style>
