<script lang="ts">
	// Types/constants
	import type { LlmConnectionRow } from '$/collections/LlmConnections.ts'
	import type { AgentChatTree } from '$/data/AgentChatTree.ts'
	import type { AgentChatTurn } from '$/data/AgentChatTurn.ts'


	// Context
	import { page } from '$app/state'


	// Props
	let {
		turn,
		allTurns,
		tree,
		connections = [],
	}: {
		turn: AgentChatTurn
		allTurns: AgentChatTurn[]
		tree: AgentChatTree
		connections?: readonly LlmConnectionRow[]
	} = $props()


	// (Derived)
	const children = $derived(
		allTurns.filter((t) => t.parentId === turn.id),
	)

	type TabItem =
		| { id: string, label: string, type: 'child', child: AgentChatTurn }
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


	// Functions
	import {
		collectAgentChatTurnDescendantIds,
		deleteAgentChatTurn,
		retryAgentChatTurn,
		submitAgentChatTurn,
	} from '$/lib/agentChat.ts'
	import { goto } from '$app/navigation'

	const handleDelete = () => {
		const ids = collectAgentChatTurnDescendantIds(turn.id, allTurns)
		const currentHash = page.url.hash
		const hashWasDeleted = [...ids].some((id) => currentHash === `#turn:${id}`)
		deleteAgentChatTurn(turn.id, allTurns)
		if (hashWasDeleted && turn.parentId)
			goto(`${page.url.pathname}#turn:${turn.parentId}`, { replaceState: true })
		else if (hashWasDeleted)
			goto(page.url.pathname, { replaceState: true })
	}

	function parseModelValue(v: string): [string | null, string | null] {
		if (!v || !v.includes(':')) return [null, null]
		const [a, b] = v.split(':')
		return [a?.trim() ?? null, b?.trim() ?? null]
	}

	const handleSubmit = async (value: string, entityRefs: import('$/data/EntityRef.ts').EntityRef[]) => {
		const [connectionId, modelId] = parseModelValue(modelValue)
		const turnId = await submitAgentChatTurn({
			treeId: tree.id,
			parentId: turn.id,
			userPrompt: value,
			entityRefs,
			systemPrompt: tree.systemPrompt,
			connectionId: connectionId ?? tree.defaultConnectionId ?? null,
			modelId: modelId ?? tree.defaultModelId ?? null,
		})
		goto(`${page.url.pathname}#turn:${turnId}`, { replaceState: true })
	}


	// State
	let promptValue = $state('')
	let modelValue = $state('')
	let activeTab = $state('')

	const isTarget = $derived(page.url.hash === `#turn:${turn.id}`)

	$effect(() => {
		if (!useTabs) return
		const hash = page.url.hash
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


	// (Derived)
	const showPromptForm = $derived(
		(turn.status === 'complete' || turn.status === 'error')
			&& (isTarget || promptValue.trim() !== ''),
	)


	// Actions
	const handleRetry = () => {
		retryAgentChatTurn({
			turnId: turn.id,
			allTurns,
			systemPrompt: tree.systemPrompt,
		})
	}


	// Components
	import ModelInput from '$/components/ModelInput.svelte'
	import Tabs from '$/components/Tabs.svelte'
	import EntityRefInput from '$/components/EntityRefInput.svelte'
	import AgentChatTurnNode from './AgentChatTurnNode.svelte'


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
		<a
			href="#turn:{turn.id}"
			class="turn-card-reply"
		><span class="sr-only">Reply</span></a>
	{/if}

	<div data-row="gap-2 align-center justify-between">
		<div data-column="gap-2" data-row-item="flexible">
			<strong>User</strong>
			<p>{turn.userPrompt}</p>
		</div>
		<button
			type="button"
			onclick={handleDelete}
		>Delete</button>
	</div>

	{#if turn.status === 'generating'}
		<p data-text="muted">Generating…</p>
	{:else if turn.status === 'error'}
		<div data-row="gap-2 align-center">
			<p data-error>{turn.error ?? 'Generation failed.'}</p>
			<button
				type="button"
				onclick={handleRetry}
			>Retry</button>
		</div>
	{:else if turn.status === 'cancelled'}
		<p data-text="muted">Cancelled.</p>
	{:else if turn.assistantText || (turn.toolCalls?.length ?? 0) > 0}
		<div data-column="gap-2">
			<strong>Assistant</strong>
			{#if turn.toolCalls && turn.toolCalls.length > 0}
				<details data-card="radius-2 padding-2">
					<summary>Tools ({turn.toolCalls.length})</summary>
					<ul data-column="gap-1">
						{#each turn.toolCalls as tc (tc.id)}
							<li>
								<code>{tc.name}</code>
								{#if turn.toolResults}
									{@const res = turn.toolResults.find((r) => r.toolCallId === tc.id)}
									{#if res}
										<pre data-text="muted" style="font-size: 0.85em; overflow: auto;">{typeof res.result === 'string' ? res.result : JSON.stringify(res.result, null, 2)}</pre>
									{/if}
								{/if}
							</li>
						{/each}
					</ul>
				</details>
			{/if}
			{#if turn.assistantText}
				<p>{turn.assistantText}</p>
			{/if}
			<small data-text="muted">
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
					<div data-column="gap-2">
						{#if connections.length > 0}
							<div data-row="gap-2 align-center">
								<ModelInput
									connections={connections}
									bind:value={modelValue}
									placeholder="Model (optional)"
									ariaLabel="Model"
								/>
							</div>
						{/if}
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
					</div>
				{:else}
					<AgentChatTurnNode
						turn={item.child}
						{allTurns}
						{tree}
						{connections}
					/>
				{/if}
			{/snippet}
		</Tabs>
	{:else if children.length > 0}
		<div data-column="gap-2">
			{#each children as child (child.id)}
				<div animate:flip={{ duration: 250, easing: expoOut }}>
					<AgentChatTurnNode
						turn={child}
						{allTurns}
						{tree}
						{connections}
					/>
				</div>
			{/each}
		</div>
	{:else if showPromptForm}
		<div data-column="gap-2">
			{#if connections.length > 0}
				<div data-row="gap-2 align-center">
					<ModelInput
						connections={connections}
						bind:value={modelValue}
						placeholder="Model (optional)"
						ariaLabel="Model"
					/>
				</div>
			{/if}
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
		</div>
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
