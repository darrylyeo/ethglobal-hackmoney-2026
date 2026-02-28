<script lang="ts">
	// Types/constants
	import { agentChatTreesCollection } from '$/collections/AgentChatTrees.ts'
	import type { WithSource } from '$/constants/data-sources.ts'
	import type { LlmConnection } from '$/data/LlmConnection.ts'
	import { walletConnectionsCollection } from '$/collections/WalletConnections.ts'
	import type { AgentChatTree } from '$/data/AgentChatTree.ts'
	import type { AgentChatTurn } from '$/data/AgentChatTree.ts'
	import { WalletConnectionTransport } from '$/data/WalletConnection.ts'
	import type { WalletConnection$Id } from '$/data/WalletConnection.ts'
	import { stringify } from 'devalue'
	import { useLiveQuery, eq } from '@tanstack/svelte-db'


	// Props
	let {
		tree,
		turns,
		connections = [],
		requestUserInteraction,
		toolsForChat,
	}: {
		tree: AgentChatTree
		turns: AgentChatTurn[]
		connections?: readonly WithSource<LlmConnection>[]
		requestUserInteraction?: (callback: () => Promise<unknown>) => Promise<unknown>
		toolsForChat?: string[] | null
	} = $props()

	// (Derived)
	const rootTurn = $derived(
		turns.find((t) => t.parentId === null),
	)
	const treeModelValue = $derived(
		tree.defaultConnectionId && tree.defaultModelId
			? `${tree.defaultConnectionId}:${tree.defaultModelId}`
			: '',
	)

	const walletConnectionsQuery = useLiveQuery(
		(q) =>
			q
				.from({ row: walletConnectionsCollection })
				.where(({ row }) => eq(row.transport, WalletConnectionTransport.Eip1193))
				.select(({ row }) => ({ row })),
		[],
	)
	const eip1193Connections = $derived(
		(walletConnectionsQuery.data ?? []).map(({ row: connection }) => connection).filter(Boolean),
	)
	const paymentConnectionIdStr = $derived(
		tree.paymentWalletConnection$id
			? JSON.stringify(tree.paymentWalletConnection$id)
			: '',
	)


	// Functions
	const updateTreeName = (name: string) => {
		agentChatTreesCollection.update(tree.$id.id, (draft) => {
			draft.name = name || null
			draft.updatedAt = Date.now()
		})
	}
	const updateTreeModel = (v: string) => {
		const [connectionId, modelId] =
			v && v.includes(':') ? v.split(':').map((s) => s?.trim() ?? null) : [null, null]
		agentChatTreesCollection.update(tree.$id.id, (draft) => {
			draft.defaultConnectionId = connectionId ?? undefined
			draft.defaultModelId = modelId ?? undefined
			draft.updatedAt = Date.now()
		})
	}
	const togglePin = () => {
		agentChatTreesCollection.update(tree.$id.id, (draft) => {
			draft.pinned = !draft.pinned
			draft.updatedAt = Date.now()
		})
	}
	const setTreePaymentWallet = ($id: WalletConnection$Id | null) => {
		agentChatTreesCollection.update(tree.$id.id, (draft) => {
			draft.paymentWalletConnection$id = $id ?? undefined
			draft.updatedAt = Date.now()
		})
	}


	// Components
	import { Button } from 'bits-ui'
	import ModelInput from '$/components/ModelInput.svelte'
	import AgentChatTurnNode from './AgentChatTurnNode.svelte'
</script>


<div
	data-column="gap-4"
	id="agent-chat:{tree.$id.id}"
>
	<div data-row="align-center">
		<input
			type="text"
			bind:value={() => tree.name ?? '', updateTreeName}
			placeholder="Untitled conversation"
			data-row-item="flexible"
		/>
		<Button.Root href="/agents/new">
			New conversation
		</Button.Root>
		<Button.Root onclick={togglePin}>
			{tree.pinned ? 'Unpin' : 'Pin'}
		</Button.Root>
	</div>

	{#if connections.length > 0}
		<div data-row="align-center">
			<label for="tree-model-{tree.$id.id}">Default model</label>
			<ModelInput
				id="tree-model-{tree.$id.id}"
				connections={connections}
				bind:value={() => treeModelValue, updateTreeModel}
				placeholder="Default model"
				ariaLabel="Default model"
			/>
		</div>
	{/if}

	<div data-row="align-center">
		<label for="tree-payment-{tree.$id.id}">Payment account</label>
		<select
			id="tree-payment-{tree.$id.id}"
			aria-label="Wallet for agent payments (x402)"
			value={paymentConnectionIdStr}
			onchange={(e) => {
				const v = (e.currentTarget as HTMLSelectElement).value
				setTreePaymentWallet(
					v
						? (JSON.parse(v) as WalletConnection$Id)
						: null,
				)
			}}
		>
			<option value="">No payment wallet</option>
			{#each eip1193Connections as conn (stringify(conn.$id))}
				{@const connIdStr = JSON.stringify(conn.$id)}
				{@const addr = conn.activeActor ?? conn.actors[0] ?? null}
				<option value={connIdStr}>
					{addr
						? `${addr.slice(0, 6)}…${addr.slice(-4)}`
						: conn.status}
				</option>
			{/each}
		</select>
	</div>

	<details>
		<summary>System prompt</summary>
		<pre data-card>{tree.systemPrompt}</pre>
	</details>

	{#if rootTurn}
		<AgentChatTurnNode
			turn={rootTurn}
			allTurns={turns}
			{tree}
			{connections}
			{requestUserInteraction}
			{toolsForChat}
		/>
	{:else}
		<p data-text="muted">No messages yet. Type a prompt below to start.</p>
	{/if}
</div>
