<script lang="ts">
	// Types/constants
	import type { WithSource } from '$/constants/data-sources.ts'
	import type { LlmConnection } from '$/data/LlmConnection.ts'
	import type { AgentChatTree } from '$/data/AgentChatTree.ts'
	import type { AgentChatTurn } from '$/data/AgentChatTurn.ts'
	import { EntityType } from '$/data/$EntityType.ts'
	import { entityKey } from '$/lib/entity-key.ts'


	// Context
	import { page } from '$app/state'


	// Props
	let {
		turn,
		allTurns,
		tree,
		connections = [],
		requestUserInteraction,
		toolsForChat,
	}: {
		turn: AgentChatTurn
		allTurns: AgentChatTurn[]
		tree: AgentChatTree
		connections?: readonly WithSource<LlmConnection>[]
		requestUserInteraction?: (callback: () => Promise<unknown>) => Promise<unknown>
		toolsForChat?: string[] | null
	} = $props()

	// (Derived)
	const children = $derived(
		allTurns.filter((t) => t.parentId === turn.$id)
	)

	type TabItem = (
		| { id: string, label: string, type: 'child', child: AgentChatTurn }
		| { id: string, label: string, type: 'reply' }
	)

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

	const useTabs = $derived(
		tabItems.length > 1
	)


	// Functions
	import {
		collectAgentChatTurnDescendantIds,
		deleteAgentChatTurn,
		retryAgentChatTurn,
		submitAgentChatTurn,
	} from '$/lib/agentChat.ts'
	import { goto } from '$app/navigation'

	const turnHash = (id: string) =>
		'#' + entityKey({ entityType: EntityType.AgentChatTurn, entityId: id })

	const onDelete = () => {
		const ids = collectAgentChatTurnDescendantIds(turn.$id, allTurns)
		const currentHash = page.url.hash
		const hashWasDeleted = [...ids].some((id) => currentHash === turnHash(id))
		deleteAgentChatTurn(turn.$id, allTurns)
		if (hashWasDeleted && turn.parentId)
			goto(`${page.url.pathname}${turnHash(turn.parentId)}`, { replaceState: true })
		else if (hashWasDeleted)
			goto(page.url.pathname, { replaceState: true })
	}

	function parseModelValue(v: string): [string | null, string | null] {
		if (!v || !v.includes(':')) return [null, null]
		const [a, b] = v.split(':')
		return [a?.trim() ?? null, b?.trim() ?? null]
	}

	const onSubmit = async (value: string, entityRefs: import('$/data/EntityRef.ts').EntityRef[]) => {
		const [connectionId, modelId] = parseModelValue(modelValue)
		const turnId = await submitAgentChatTurn({
			treeId: tree.$id.id,
			parentId: turn.$id,
			userPrompt: value,
			entityRefs,
			systemPrompt: tree.systemPrompt,
			connectionId: connectionId ?? tree.defaultConnectionId ?? null,
			modelId: modelId ?? tree.defaultModelId ?? null,
			requestUserInteraction,
			toolsForChat: toolsForChat ?? undefined,
		})
		goto(`${page.url.pathname}${turnHash(turnId)}`, { replaceState: true })
	}


	// State
	let promptValue = $state(
		''
	)
	let modelValue = $state(
		''
	)
	let activeTab = $state(
		''
	)

	const turnHashPrefix = '#' + EntityType.AgentChatTurn + ':'
	const isTarget = $derived(
		page.url.hash === turnHash(turn.$id)
	)

	$effect(() => {
		if (!useTabs) return
		const hash = page.url.hash
		if (hash === turnHash(turn.$id) && showPromptForm)
			activeTab = 'reply'
		else if (hash?.startsWith(turnHashPrefix)) {
			const turnId = hash.slice(turnHashPrefix.length)
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
			&& (isTarget || promptValue.trim() !== '')
	)


	// Actions
	const onRetry = () => {
		retryAgentChatTurn({
			turnId: turn.$id,
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
	data-column
	id="turn:{turn.$id}"
	class="turn-card status-{turn.status}"
>
	{#if (turn.status === 'complete' || turn.status === 'error') && !showPromptForm}
		<a
			href="#turn:{turn.$id}"
			class="turn-card-reply"
		><span class="sr-only">Reply</span></a>
	{/if}

	<div data-row="align-center justify-between">
		<div data-column data-row-item="flexible">
			<strong>User</strong>
			<p>{turn.userPrompt}</p>
		</div>

		<button
			type="button"
			onclick={onDelete}
		>Delete</button>
	</div>

	{#if turn.status === 'generating'}
		<p data-text="muted">Generating…</p>
	{:else if turn.status === 'error'}
		<div data-column>
			<div data-row="align-center">
				<p data-error>{turn.error ?? 'Generation failed.'}</p>

				<button
					type="button"
					onclick={onRetry}
				>Retry</button>
			</div>

			{#if turn.error?.includes('payment') || turn.error?.includes('402')}
				<p data-text="muted">
					Set <strong>Payment account</strong> for this conversation (above) to pay for agent requests, then retry.
				</p>
			{/if}
		</div>
	{:else if turn.status === 'cancelled'}
		<p data-text="muted">Cancelled.</p>
	{:else if turn.assistantText || (turn.toolCalls?.length ?? 0) > 0}
		<div data-column>
			<strong>Assistant</strong>
			{#if turn.toolCalls && turn.toolCalls.length > 0}
				<details data-card>
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
					<div data-column>
						{#if connections.length > 0}
							<div data-row="align-center">
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
								onSubmit(value, entityRefs)
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
						{requestUserInteraction}
						{toolsForChat}
					/>
				{/if}
			{/snippet}
		</Tabs>
	{:else if children.length > 0}
		<div data-column>
			{#each children as child (child.id)}
				<div animate:flip={{ duration: 250, easing: expoOut }}>
					<AgentChatTurnNode
						turn={child}
						{allTurns}
						{tree}
						{connections}
						{requestUserInteraction}
						{toolsForChat}
					/>
				</div>
			{/each}
		</div>
	{:else if showPromptForm}
		<div data-column>
			{#if connections.length > 0}
				<div data-row="align-center">
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
					onSubmit(value, entityRefs)
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

		&.status-generating {
			opacity: 0.7;
			animation: pulse 1.5s ease-in-out infinite;
		}

		&.status-error {
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
