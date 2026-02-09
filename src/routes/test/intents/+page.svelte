<script lang="ts">
	// Types/constants
	import type { IntentDragPayload } from '$/constants/intents.ts'
	import { DataSource } from '$/constants/data-sources.ts'
	import { intents, IntentPlacement } from '$/constants/intents.ts'
	import { networksByChainId } from '$/constants/networks.ts'
	import { EntityType } from '$/data/$EntityType.ts'


	// Context
	import { useLiveQuery, eq } from '@tanstack/svelte-db'


	// Functions
	import { formatSmallestToDecimal } from '$/lib/format.ts'
	import { getIntentDragPayload } from '$/lib/intents/drag.ts'
	import { entityIntent } from '$/lib/intents/intentDraggable.svelte.ts'
	import { resolveIntentForDrag } from '$/lib/intents.ts'

	const resolveChainName = (chainId: number) =>
		Object.values(networksByChainId).find((entry) => entry?.id === chainId)
			?.name ?? `Chain ${chainId}`


	// State
	import { actorCoinsCollection } from '$/collections/ActorCoins.ts'

	let fromPayload = $state<IntentDragPayload | null>(null)
	let toPayload = $state<IntentDragPayload | null>(null)

	const actorCoinsQuery = useLiveQuery((q) =>
		q.from({ row: actorCoinsCollection }).select(({ row }) => ({ row })),
	)


	// (Derived)
	const actorCoins = $derived((actorCoinsQuery.data ?? []).map((r) => r.row))

	const resolution = $derived(
		fromPayload && toPayload
			? resolveIntentForDrag(fromPayload.entity, toPayload.entity)
			: null,
	)


	// Actions
	const setPayload = (placement: 'from' | 'to', payload: IntentDragPayload) => {
		if (placement === 'from') fromPayload = payload
		else toPayload = payload
	}

	const onDrop = (placement: 'from' | 'to') => (event: DragEvent) => {
		event.preventDefault()
		const payload = getIntentDragPayload(event)
		if (!payload) return
		setPayload(placement, payload)
	}

	const onDragOver = (event: DragEvent) => {
		event.preventDefault()
	}


	// Components
	import EntityId from '$/components/EntityId.svelte'
</script>


<main
	id="main"
	data-column="gap-6"
	data-sticky-container
>
	<section data-scroll-item data-column="gap-3">
		<h1>Entity intents</h1>
		<p data-text="muted">Drag balances into from/to slots to resolve intents.</p>
	</section>

	<section data-scroll-item data-column="gap-3">
		<h2>Registered intents ({intents.length})</h2>
		<div data-column="gap-2">
			{#each intents as intent}
				<div data-card="padding-3" data-column="gap-2">
					<strong>{intent.label}</strong>
					<small data-text="muted">{intent.type}</small>
					<div data-row="gap-2 wrap">
						{#each intent.entities as entity}
							<code>{entity.name}: {entity.type}</code>
						{/each}
					</div>
					<div data-row="gap-2 wrap">
						{#each intent.invocations as invocation}
							<span data-text="muted">
								{invocation.modality}: {invocation.entities.dragTarget} → {invocation.entities.dropTarget}
							</span>
						{/each}
					</div>
				</div>
			{/each}
		</div>
	</section>

	<section data-scroll-item data-column="gap-3">
		<h2>Intent slots</h2>
		<div data-row="gap-3 wrap">
			<div
				class="intent-slot"
				data-card="padding-4"
				ondrop={onDrop('from')}
				ondragover={onDragOver}
				role="button"
				tabindex="0"
			>
				<strong>From (drag source)</strong>
				{#if fromPayload}
					<pre data-text="muted">{JSON.stringify(fromPayload, null, 2)}</pre>
				{:else}
					<p data-text="muted">Drop an entity</p>
				{/if}
			</div>
			<div
				class="intent-slot"
				data-card="padding-4"
				ondrop={onDrop('to')}
				ondragover={onDragOver}
				role="button"
				tabindex="0"
			>
				<strong>To (drop target)</strong>
				{#if toPayload}
					<pre data-text="muted">{JSON.stringify(toPayload, null, 2)}</pre>
				{:else}
					<p data-text="muted">Drop an entity</p>
				{/if}
			</div>
		</div>
	</section>

	<section data-scroll-item data-column="gap-3">
		<h2>Balances (TanStack DB cache)</h2>
		{#if actorCoins.length === 0}
			<p data-text="muted">No cached balances yet.</p>
		{:else}
			<div data-column="gap-2">
			{#each actorCoins as row (row.$id.chainId + row.$id.address + row.$id.tokenAddress)}
				{@const intent = entityIntent(EntityType.ActorCoin, row.$id, 'intent-test')}
				<div data-row="gap-2 align-center">
					<EntityId
						className="intent-entity"
						draggableText={`${row.symbol} ${row.$id.address}`}
						entityType={EntityType.ActorCoin}
						entityId={row.$id}
						source="intent-test"
					>
						<span>
							{row.symbol} · {resolveChainName(row.$id.chainId)}
							· {row.$id.address.slice(0, 8)}…{row.$id.address.slice(-4)}
							· {formatSmallestToDecimal(row.balance, row.decimals, 4)}
						</span>
					</EntityId>
					{#if intent}
						<button
							type="button"
							onclick={() =>
								setPayload('from', {
									...intent,
									context: { ...intent.context, placement: IntentPlacement.From },
								})}
						>
							From
						</button>
						<button
							type="button"
							onclick={() =>
								setPayload('to', {
									...intent,
									context: { ...intent.context, placement: IntentPlacement.To },
								})}
						>
							To
						</button>
					{/if}
				</div>
				{/each}
			</div>
		{/if}
	</section>

	<section data-scroll-item data-column="gap-3">
		<h2>Resolved intent</h2>
		{#if resolution?.matched}
			<div data-card="padding-3" data-column="gap-3">
				<strong>{resolution.intent.label}</strong>

				{#if resolution.error}
					<p data-text="muted">Error: {resolution.error instanceof Error ? resolution.error.message : String(resolution.error)}</p>
				{:else if resolution.options.length === 0}
					<p data-text="muted">No options resolved.</p>
				{:else}
					<div data-column="gap-2">
						{#each resolution.options as option, i (i)}
							<div data-card="padding-2" data-column="gap-2">
								<strong>{option.name}</strong>
								<ol data-column="gap-2">
									{#each option.sessionTemplate.actions as action (action.type)}
										<li>{action.type}</li>
									{/each}
								</ol>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		{:else if resolution}
			<p data-text="muted">No matching intent for these entity types.</p>
		{:else}
			<p data-text="muted">Select two entities.</p>
		{/if}
	</section>
</main>


<style>
	.intent-slot {
		min-height: 140px;
		border: 1px dashed var(--color-border);
	}

	:global(.intent-entity) {
		cursor: grab;
	}

	:global(.intent-entity:active) {
		cursor: grabbing;
	}
</style>

