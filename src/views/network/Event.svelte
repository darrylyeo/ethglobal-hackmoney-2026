<script lang="ts">
	// Types/constants
	import type { EvmLog } from '$/api/voltaire.ts'
	import type { ChainId } from '$/constants/networks.ts'
	import {
		ensureEvmEventSignatures,
		evmTopicsCollection,
		normalizeEvmTopic32,
	} from '$/collections/EvmTopics.ts'
	import { eq, useLiveQuery } from '@tanstack/svelte-db'


	// Props
	let {
		event,
		chainId,
		decoded,
	}: {
		event: EvmLog
		chainId: ChainId
		decoded?: { name: string; args: Record<string, unknown> }
	} = $props()

	// (Derived)
	const logIndex = $derived(
		parseInt(event.logIndex, 16)
	)
	const topic0 = $derived(
		event.topics[0] && event.topics[0].length >= 66
			? (`0x${event.topics[0].slice(2).toLowerCase().padStart(64, '0')}` as `0x${string}`)
			: null
	)


	// Context
	const normalizedTopic0 = $derived(
		topic0 ? normalizeEvmTopic32(topic0) : null
	)
	const eventSigQuery = useLiveQuery(
		(q) =>
			q
				.from({ row: evmTopicsCollection })
				.where(({ row }) =>
					eq(
						row.$id.hex,
						normalizedTopic0 ?? (`0x${'0'.repeat(64)}` as `0x${string}`),
					),
				)
				.select(({ row }) => ({ row })),
		[() => normalizedTopic0],
	)

	// (Derived)
	const eventSignatures = $derived(
		topic0
			? (eventSigQuery.data?.[0]?.row?.signatures ?? [])
			: []
	)


	// Actions
	$effect(() => {
		if (topic0) void ensureEvmEventSignatures(topic0).catch(() => {})
	})


	// Components
	import TruncatedValue from '$/components/TruncatedValue.svelte'
	import Address from '$/views/Address.svelte'
</script>


<details
	data-card
	id="event:{logIndex}"
>
	<summary>
		<div data-row="wrap align-center">
			<code>
				#{logIndex}
			</code>
			{#if decoded}
				<code>{decoded.name}</code>
			{:else if eventSignatures.length > 0}
				<code data-row="wrap gap-1">
					{#each eventSignatures as sig}
						<span>{sig}</span>
					{/each}
				</code>

				<Address actorId={{ $network: { chainId }, address: event.address as `0x${string}` }} />
			{:else}
				<Address actorId={{ $network: { chainId }, address: event.address as `0x${string}` }} />
				{#if event.topics[0]}
					<TruncatedValue
						value={event.topics[0]}
						startLength={10}
						endLength={4}
					/>
				{/if}
			{/if}
		</div>
	</summary>

	{#if decoded}
		<dl>
			<dt>
				Event
			</dt>
			<dd><code>{decoded.name}</code></dd>
			{#each Object.entries(decoded.args) as [key, val]}
				<dt>{key}</dt>
				<dd>{String(val)}</dd>
			{/each}
		</dl>

		<details>
			<summary>
				Raw
			</summary>
			<dl>
				<dt>
					Log Index
				</dt>
				<dd>{logIndex}</dd>
				<dt>
					Address
				</dt>
				<dd><Address actorId={{ $network: { chainId }, address: event.address as `0x${string}` }} /></dd>
				{#each event.topics as topic, i}
					<dt>
						Topic {i}
					</dt>
					<dd><TruncatedValue value={topic} /></dd>
				{/each}

				{#if event.data !== '0x'}
					<dt>
						Data
					</dt>
					<dd>
						<TruncatedValue
							value={event.data}
							startLength={10}
							endLength={8}
						/>
						<span>
							({Math.max(0, (event.data.length - 2) / 2)} bytes)
						</span>
					</dd>
				{/if}
			</dl>
		</details>
	{:else}
		<dl>
			<dt>
				Log Index
			</dt>
			<dd>{logIndex}</dd>
			<dt>
				Address
			</dt>
			<dd><Address actorId={{ $network: { chainId }, address: event.address as `0x${string}` }} /></dd>
			{#each event.topics as topic, i}
				<dt>
					Topic {i}
				</dt>
				<dd><TruncatedValue value={topic} /></dd>
			{/each}

			{#if event.data !== '0x'}
				<dt>
					Data
				</dt>
				<dd>
					<TruncatedValue
						value={event.data}
						startLength={10}
						endLength={8}
					/>
					<span>
						({Math.max(0, (event.data.length - 2) / 2)} bytes)
					</span>
				</dd>
			{/if}
		</dl>
	{/if}
</details>
