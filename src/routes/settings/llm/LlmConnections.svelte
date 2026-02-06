<script lang="ts">
	// Types/constants
	import type { LlmConnectionRow } from '$/collections/llm-connections'
	import {
		type LlmConnectionProviderType,
		LlmConnectionProvider,
	} from '$/data/LlmConnection'
	import { DataSource } from '$/constants/data-sources'

	// Context
	import { useLiveQuery, eq } from '@tanstack/svelte-db'
	import { registerLocalLiveQueryStack } from '$/svelte/live-query-context.svelte'
	import {
		llmConnectionsCollection,
		addLlmConnection,
		removeLlmConnection,
		updateLlmConnection,
		PROVIDER_LABELS,
	} from '$/collections/llm-connections'
	import { getModelsForConnection } from '$/api/llm/connection-provider'

	const connectionsQuery = useLiveQuery((q) =>
		q
			.from({ row: llmConnectionsCollection })
			.where(({ row }) => eq(row.$source, DataSource.Local))
			.select(({ row }) => ({ row })),
	)
	registerLocalLiveQueryStack(() => [
		{ id: 'llm-connections', label: 'LLM Connections', query: connectionsQuery },
	])

	const connections = $derived(
		(connectionsQuery.data ?? []).map((r) => r.row).filter(Boolean) as LlmConnectionRow[],
	)

	const addItems = $derived(
		(
			[
				LlmConnectionProvider.OpenAI,
				LlmConnectionProvider.Anthropic,
				LlmConnectionProvider.Google,
				LlmConnectionProvider.Zen,
				LlmConnectionProvider.Hosted,
			] as LlmConnectionProviderType[]
		).map((provider) => ({
			type: 'item',
			id: `add-${provider}`,
			item: { provider, label: PROVIDER_LABELS[provider] ?? provider },
			onSelect: () => {
				addLlmConnection({
					provider,
					label: `${PROVIDER_LABELS[provider] ?? provider} (new)`,
				})
			},
		})),
	)

	const needsApiKey = (provider: LlmConnectionProviderType) =>
		provider === LlmConnectionProvider.OpenAI ||
		provider === LlmConnectionProvider.Anthropic ||
		provider === LlmConnectionProvider.Google
	const needsEndpoint = (provider: LlmConnectionProviderType) =>
		provider === LlmConnectionProvider.Hosted

	// Actions
	const handleRemove = (id: string) => removeLlmConnection(id)
	const handleLabelChange = (id: string, value: string) =>
		updateLlmConnection(id, { label: value })
	const handleApiKeyChange = (id: string, value: string) =>
		updateLlmConnection(id, { apiKey: value })
	const handleEndpointChange = (id: string, value: string) =>
		updateLlmConnection(id, { endpoint: value })
	const handleDefaultModelChange = (id: string, value: string) =>
		updateLlmConnection(id, { defaultModelId: value || undefined })

	// Components
	import Dropdown from '$/components/Dropdown.svelte'
	import { Button } from 'bits-ui'
</script>

<div data-row="wrap align-start">
	<details data-row-item="flexible" data-card="radius-4" open>
		<summary data-row="gap-2 align-center wrap">
			<div data-row>
				<div data-row="gap-2 align-center">
					<h4>LLM Connections</h4>
					<span
						data-badge="small"
						aria-label="{connections.length} connections"
					>
						{connections.length}
					</span>
				</div>
				<Dropdown
					items={addItems}
					triggerLabel="+"
					triggerAriaLabel="Add LLM connection"
					triggerProps={{ onclick: (e: MouseEvent) => e.stopPropagation() }}
					getItemId={(item) => item.provider}
					getItemLabel={(item) => item.label}
				>
					{#snippet Item(item)}
						<span>{item.label}</span>
					{/snippet}
				</Dropdown>
			</div>
		</summary>

		<ul class="list" data-column="gap-2">
			{#each connections as conn (conn.id)}
				{@const models = getModelsForConnection(conn)}
				<li>
					<details data-card="radius-3 padding-2" open>
						<summary data-row="gap-2 align-center justify-between wrap">
							<span data-row="gap-2 align-center">
								<strong>{conn.label}</strong>
								<span data-muted>({PROVIDER_LABELS[conn.provider] ?? conn.provider})</span>
							</span>
							<Button.Root
								type="button"
								onclick={() => handleRemove(conn.id)}
							>
								Remove
							</Button.Root>
						</summary>
						<div class="panel" data-column="gap-2">
							<div data-row="gap-2 align-center">
								<label for="llm-label-{conn.id}">Label</label>
								<input
									id="llm-label-{conn.id}"
									type="text"
									bind:value={() => conn.label, (v) => handleLabelChange(conn.id, v)}
								/>
							</div>
							{#if needsApiKey(conn.provider)}
								<div data-row="gap-2 align-center">
									<label for="llm-apikey-{conn.id}">API key</label>
									<input
										id="llm-apikey-{conn.id}"
										type="password"
										placeholder="Optional if set in env"
										bind:value={() => conn.apiKey ?? '', (v) =>
											handleApiKeyChange(conn.id, v)}
									/>
								</div>
							{/if}
							{#if needsEndpoint(conn.provider)}
								<div data-row="gap-2 align-center">
									<label for="llm-endpoint-{conn.id}">Endpoint</label>
									<input
										id="llm-endpoint-{conn.id}"
										type="url"
										placeholder="https://..."
										bind:value={() => conn.endpoint ?? '', (v) =>
											handleEndpointChange(conn.id, v)}
									/>
								</div>
							{/if}
							{#if conn.provider === LlmConnectionProvider.Zen}
								<div data-row="gap-2 align-center">
									<label for="llm-apikey-zen-{conn.id}">API key</label>
									<input
										id="llm-apikey-zen-{conn.id}"
										type="password"
										placeholder="Optional if PUBLIC_OPENCODE_ZEN_API_KEY set"
										bind:value={() => conn.apiKey ?? '', (v) =>
											handleApiKeyChange(conn.id, v)}
									/>
								</div>
							{/if}
							{#if models.length > 0}
								<div data-row="gap-2 align-center">
									<label for="llm-model-{conn.id}">Default model</label>
									<select
										id="llm-model-{conn.id}"
										bind:value={() => conn.defaultModelId ?? '', (v) =>
											handleDefaultModelChange(conn.id, v)}
									>
										<option value="">—</option>
										{#each models as m (m.id)}
											<option value={m.id}>{m.label}</option>
										{/each}
									</select>
								</div>
							{/if}
						</div>
					</details>
				</li>
			{/each}
		</ul>
	</details>
</div>
