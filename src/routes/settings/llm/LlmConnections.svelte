<script lang="ts">
	// Types/constants
	import { getModelsForConnection } from '$/api/llm/connection-provider.ts'
	import type { WithSource } from '$/constants/data-sources.ts'
	import type { LlmConnection } from '$/data/LlmConnection.ts'
	import { DataSourceId } from '$/constants/data-sources.ts'
	import {
		type LlmConnectionProviderType,
		LlmConnectionProvider,
	} from '$/data/LlmConnection.ts'


	// Context
	import { useLiveQuery, eq } from '@tanstack/svelte-db'
	import {
		llmConnectionsCollection,
		addLlmConnection,
		removeLlmConnection,
		updateLlmConnection,
		PROVIDER_LABELS,
	} from '$/collections/LlmConnections.ts'
	import { registerLocalLiveQueryStack } from '$/svelte/live-query-context.svelte.ts'

	const connectionsQuery = useLiveQuery((q) =>
		q
			.from({ llmConnection: llmConnectionsCollection })
			.select(({ llmConnection }) => ({ llmConnection })),
	)
	registerLocalLiveQueryStack(() => [
		{ id: 'llm-connections', label: 'LLM Connections', query: connectionsQuery },
	])

	// (Derived)
	const connections = $derived(
		(connectionsQuery.data ?? []).map(({ llmConnection: connection }) => connection).filter(Boolean) as WithSource<LlmConnection>[]
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
			type: 'item' as const,
			id: `add-${provider}`,
			item: { provider, label: PROVIDER_LABELS[provider] ?? provider },
			onSelect: () => {
				addLlmConnection({
					provider,
					label: `${PROVIDER_LABELS[provider] ?? provider} (new)`,
				})
			},
		}))
	)


	// Functions
	const needsApiKey = (provider: LlmConnectionProviderType) =>
		provider === LlmConnectionProvider.OpenAI ||
		provider === LlmConnectionProvider.Anthropic ||
		provider === LlmConnectionProvider.Google
	const needsEndpoint = (provider: LlmConnectionProviderType) =>
		provider === LlmConnectionProvider.Hosted


	// Actions
	const onRemove = (id: string) => removeLlmConnection(id)
	const onLabelChange = (id: string, value: string) =>
		updateLlmConnection(id, { label: value })
	const onApiKeyChange = (id: string, value: string) =>
		updateLlmConnection(id, { apiKey: value })
	const onEndpointChange = (id: string, value: string) =>
		updateLlmConnection(id, { endpoint: value })
	const onDefaultModelChange = (id: string, value: string) =>
		updateLlmConnection(id, { defaultModelId: value || undefined })


	// Components
	import Dropdown from '$/components/Dropdown.svelte'
	import { Button } from 'bits-ui'
</script>


<div data-column>
	<details data-card open>
		<summary>
			<div data-row="wrap">
				<div data-row>
					<h2>Connections</h2>

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

		<ul data-list="unstyled">
			{#each connections as conn (conn.id)}
				{@const models = getModelsForConnection(conn)}

				<li>
					<details data-card open>
						<summary>
							<div data-row="wrap">
								<span data-row data-row-item="flexible">
									<strong>{conn.label}</strong>
									<span data-text="muted">({PROVIDER_LABELS[conn.provider] ?? conn.provider})</span>
								</span>

								<Button.Root
									type="button"
									data-text="muted"
									onclick={() => onRemove(conn.id)}
								>
									Remove
								</Button.Root>
							</div>
						</summary>

						<div data-column>
							<div data-row>
								<label for="llm-label-{conn.id}">Label</label>

								<input
									id="llm-label-{conn.id}"
									type="text"
									data-block
									bind:value={() => conn.label, (v) => onLabelChange(conn.id, v)}
								/>
							</div>

							{#if needsApiKey(conn.provider)}
								<div data-row>
									<label for="llm-apikey-{conn.id}">API key</label>

									<input
										id="llm-apikey-{conn.id}"
										type="password"
										data-block
										placeholder="Optional if set in env"
										bind:value={() => conn.apiKey ?? '', (v) =>
											onApiKeyChange(conn.id, v)}
									/>
								</div>
							{/if}

							{#if needsEndpoint(conn.provider)}
								<div data-row>
									<label for="llm-endpoint-{conn.id}">Endpoint</label>

									<input
										id="llm-endpoint-{conn.id}"
										type="url"
										data-block
										placeholder="https://..."
										bind:value={() => conn.endpoint ?? '', (v) =>
											onEndpointChange(conn.id, v)}
									/>
								</div>
							{/if}

							{#if conn.provider === LlmConnectionProvider.Zen}
								<div data-row>
									<label for="llm-apikey-zen-{conn.id}">API key</label>

									<input
										id="llm-apikey-zen-{conn.id}"
										type="password"
										data-block
										placeholder="Optional if PUBLIC_OPENCODE_API_KEY set"
										bind:value={() => conn.apiKey ?? '', (v) =>
											onApiKeyChange(conn.id, v)}
									/>
								</div>
							{/if}

							{#if models.length > 0}
								<div data-row>
									<label for="llm-model-{conn.id}">Default model</label>

									<select
										id="llm-model-{conn.id}"
										bind:value={() => conn.defaultModelId ?? '', (v) =>
											onDefaultModelChange(conn.id, v)}
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
