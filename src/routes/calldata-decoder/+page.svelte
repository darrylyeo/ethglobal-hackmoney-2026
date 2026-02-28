<script lang="ts">
	// Types/constants
	import type { CalldataExample } from '$/constants/calldata-examples.ts'
	import type { EvmSelector } from '$/data/EvmSelector.ts'
	import type { EvmTopic } from '$/data/EvmTopic.ts'
	import { EntityLayout } from '$/components/EntityView.svelte'
	import { EntityType } from '$/data/$EntityType.ts'
	import { goto } from '$app/navigation'
	import { page } from '$app/stores'
	import { calldataExamples } from '$/constants/calldata-examples.ts'
	import {
		ensureEvmFunctionSignatures,
		evmSelectorsCollection,
		normalizeEvmSelector4,
	} from '$/collections/EvmSelectors.ts'
	import {
		ensureEvmEventSignatures,
		evmTopicsCollection,
		normalizeEvmTopic32,
	} from '$/collections/EvmTopics.ts'
	import {
		decodeCalldataWithSignature,
		decodeEventDataWithSignature,
		formatDecodedParamValue,
	} from '$/lib/calldata-decode.ts'
	import { getEvmSelectorPath, getEvmTopicPath } from '$/lib/signature-paths.ts'
	import { eq, useLiveQuery } from '@tanstack/svelte-db'


	// State
	let inputRaw = $state(
		''
	)
	let selectedExample = $state<CalldataExample | undefined>(undefined)

	function hexFromParam(value: string | null): string {
		if (!value) return ''
		const s = value.trim().replace(/^0x/i, '').replace(/\s/g, '')
		if (!/^[0-9a-fA-F]*$/.test(s)) return ''
		const even = s.length % 2 === 0 ? s : s.slice(0, -1)
		return even ? `0x${even}` : ''
	}
	let selectedSigIndex = $state(
		0
	)
	let selectedEventSigIndex = $state(
		0
	)

	// (Derived)
	const hexWithPrefix = $derived(
		inputRaw.startsWith('0x') ? inputRaw : inputRaw ? `0x${inputRaw}` : ''
	)
	const hexNormalized = $derived(
		hexWithPrefix.slice(2).toLowerCase()
	)
	const selector = $derived(
		hexNormalized.length >= 8
			? (`0x${hexNormalized.slice(0, 8).toLowerCase()}` as `0x${string}`)
			: null,
	)
	const topic = $derived(
		hexNormalized.length >= 64
			? (`0x${hexNormalized.slice(0, 64).toLowerCase()}` as `0x${string}`)
			: null,
	)
	const byteCount = $derived(
		hexNormalized ? Math.floor(hexNormalized.length / 2) : 0
	)

	const normalizedSelector = $derived(
		selector ? normalizeEvmSelector4(selector) : null
	)
	const functionSigQuery = useLiveQuery(
		(q) =>
			normalizedSelector
				? q
					.from({ row: evmSelectorsCollection })
					.where(({ row }) => eq(row.$id.hex, normalizedSelector))
					.select(({ row }) => ({ row }))
				: q.from({ row: evmSelectorsCollection }).where(({ row }) => eq(row.$id.hex, '0x' as `0x${string}`)).select(({ row }) => ({ row })),
		[() => normalizedSelector],
	)
	const selectorEntry = $derived(
		functionSigQuery.data?.[0]?.row as EvmSelector | undefined,
	)
	const functionSignatures = $derived(
		selectorEntry?.signatures ?? []
	)

	const normalizedTopic = $derived(
		topic ? normalizeEvmTopic32(topic) : null
	)
	const eventSigQuery = useLiveQuery(
		(q) =>
			normalizedTopic
				? q
					.from({ row: evmTopicsCollection })
					.where(({ row }) => eq(row.$id.hex, normalizedTopic))
					.select(({ row }) => ({ row }))
				: q.from({ row: evmTopicsCollection }).where(({ row }) => eq(row.$id.hex, '0x' as `0x${string}`)).select(({ row }) => ({ row })),
		[() => normalizedTopic],
	)
	const topicEntry = $derived(
		eventSigQuery.data?.[0]?.row as EvmTopic | undefined,
	)
	const eventSignatures = $derived(
		topicEntry?.signatures ?? []
	)

	const signatureForDecode = $derived(
		functionSignatures.length > 0
			? functionSignatures[
					Math.min(selectedSigIndex, functionSignatures.length - 1)
				]
			: null,
	)
	const decodedCall = $derived(
		hexWithPrefix && selector && signatureForDecode
			? decodeCalldataWithSignature(
					signatureForDecode,
					hexWithPrefix as `0x${string}`,
				)
			: null,
	)

	const eventSignatureForDecode = $derived(
		eventSignatures.length > 0
			? eventSignatures[
					Math.min(selectedEventSigIndex, eventSignatures.length - 1)
				]
			: null,
	)
	const decodedEvent = $derived(
		hexWithPrefix &&
			hexNormalized.length >= 64 &&
			eventSignatureForDecode
			? decodeEventDataWithSignature(
					eventSignatureForDecode,
					hexWithPrefix as `0x${string}`,
				)
			: null,
	)

	const TRUNCATE_PARAM_LENGTH = 28

	// Actions
	$effect(() => {
		const data = $page.url.searchParams.get('data')
		const fromUrl = hexFromParam(data)
		if (fromUrl) inputRaw = fromUrl
	})
	$effect(() => {
		const hex = hexWithPrefix
		const current = hexFromParam($page.url.searchParams.get('data'))
		if (hex === current) return
		const url = hex
			? `${$page.url.pathname}?data=${encodeURIComponent(hex)}`
			: $page.url.pathname
		void goto(url, { replaceState: true })
	})
	$effect(() => {
		if (selector) void ensureEvmFunctionSignatures(selector).catch(() => {})
	})
	$effect(() => {
		if (topic) void ensureEvmEventSignatures(topic).catch(() => {})
	})
	$effect(() => {
		const _ = selector
		const __ = functionSignatures.length
		selectedSigIndex = 0
	})
	$effect(() => {
		const _ = topic
		const __ = eventSignatures.length
		selectedEventSigIndex = 0
	})
	$effect(() => {
		const ex = selectedExample
		if (!ex) return
		inputRaw = ex.hex
		selectedExample = undefined
	})

	// Components
	import Collapsible from '$/components/Collapsible.svelte'
	import EntityView from '$/components/EntityView.svelte'
	import Heading from '$/components/Heading.svelte'
	import Hexadecimal from '$/components/Hexadecimal.svelte'
	import HexadecimalInput from '$/components/HexadecimalInput.svelte'
	import Select from '$/components/Select.svelte'
	import TruncatedValue from '$/components/TruncatedValue.svelte'
	import Address, { AddressFormat } from '$/views/Address.svelte'
</script>


<svelte:head>
	<title>Calldata decoder</title>
</svelte:head>


<main data-card>
	<Heading>Calldata decoder</Heading>
	<p>Paste transaction input or event data (hex) to resolve the function selector (4 bytes) and/or event topic (32 bytes) to human-readable signature(s). Use <code>?data=0x…</code> in the URL to open with hex pre-filled (shareable link).</p>

	<label data-column="gap-1">
		<span class="visually-hidden">Load example</span>
		<Select
			items={calldataExamples}
			bind:value={selectedExample}
			getItemId={(ex) => ex.id}
			getItemLabel={(ex) => ex.label}
			placeholder="Load example…"
			ariaLabel="Load example calldata"
			data-example-select
			style="font-family: ui-monospace, monospace; margin-bottom: 0.5rem;"
		/>
	</label>

	<HexadecimalInput
		bind:value={inputRaw}
		placeholder="0xa9059cbb000000000000000000000000..."
		rows={4}
		ariaLabel="Calldata (hex)"
	/>

	{#if hexWithPrefix}
		<Collapsible title="Result" open={true} detailsProps={{ style: 'margin-top: 1rem;' }}>
			<ul data-column="gap-4" class="calldata-result" role="list">
				{#if selector}
					<li>
						<EntityView
							entityType={EntityType.EvmSelector}
							entity={selectorEntry}
							entityId={{ hex: normalizedSelector ?? selector }}
							titleHref={normalizedSelector ? getEvmSelectorPath(normalizedSelector) : undefined}
							label={signatureForDecode ?? selector}
							layout={EntityLayout.PageSection}
							metadata={[{ term: 'Selector', detail: selector }]}
							annotation="Function call"
						>
							{#snippet children()}
								{#if functionSignatures.length > 0}
									<dl data-definition-list="vertical">
										<div>
											<dt>Signature</dt>
											<dd>
												{#if functionSignatures.length > 1}
													<select
														bind:value={selectedSigIndex}
														aria-label="Choose function signature for decoding"
														class="calldata-result-select"
													>
														{#each functionSignatures as sig, i}
															<option value={i}>{sig}</option>
														{/each}
													</select>
												{:else}
													<code>{functionSignatures[0]}</code>
												{/if}
											</dd>
										</div>
										{#if decodedCall}
											<div>
												<dt>Arguments</dt>
												<dd>
													<dl data-definition-list="vertical" class="calldata-result-args">
														{#each decodedCall.params as param, i}
															<div class="calldata-result-arg">
																<dt>{i}</dt>
																<dd>
																	{#if param.type === 'address' && typeof param.value === 'string'}
																		<Address address={param.value as `0x${string}`} format={AddressFormat.Full} />
																	{:else}
																		{@const str = formatDecodedParamValue(param.type, param.value)}
																		{#if str.length > TRUNCATE_PARAM_LENGTH}
																			<TruncatedValue value={str} startLength={10} endLength={8} />
																		{:else}
																			<span class="calldata-result-arg-value">{str}</span>
																		{/if}
																	{/if}
																</dd>
															</div>
														{/each}
													</dl>
												</dd>
											</div>
										{/if}
									</dl>
								{/if}
							{/snippet}
						</EntityView>
					</li>
				{/if}
				{#if topic}
					<li>
						<EntityView
							entityType={EntityType.EvmTopic}
							entity={topicEntry}
							entityId={{ hex: normalizedTopic ?? topic }}
							titleHref={normalizedTopic ? getEvmTopicPath(normalizedTopic) : undefined}
							label={eventSignatureForDecode ?? topic}
							layout={EntityLayout.PageSection}
							metadata={[{ term: 'Topic', detail: topic }]}
							annotation="Event (32+ bytes)"
						>
							{#snippet children()}
								{#if eventSignatures.length > 0}
									<dl data-definition-list="vertical">
										<div>
											<dt>Signature</dt>
											<dd>
												{#if eventSignatures.length > 1}
													<select
														bind:value={selectedEventSigIndex}
														aria-label="Choose event signature for decoding"
														class="calldata-result-select"
													>
														{#each eventSignatures as sig, i}
															<option value={i}>{sig}</option>
														{/each}
													</select>
												{:else}
													<code>{eventSignatures[0]}</code>
												{/if}
											</dd>
										</div>
										{#if decodedEvent}
											<div>
												<dt>Arguments</dt>
												<dd>
													<dl data-definition-list="vertical" class="calldata-result-args">
														{#each decodedEvent.params as param, i}
															<div class="calldata-result-arg">
																<dt>{i}</dt>
																<dd>
																	{#if param.type === 'address' && typeof param.value === 'string'}
																		<Address address={param.value as `0x${string}`} format={AddressFormat.Full} />
																	{:else}
																		{@const str = formatDecodedParamValue(param.type, param.value)}
																		{#if str.length > TRUNCATE_PARAM_LENGTH}
																			<TruncatedValue value={str} startLength={10} endLength={8} />
																		{:else}
																			<span class="calldata-result-arg-value">{str}</span>
																		{/if}
																	{/if}
																</dd>
															</div>
														{/each}
													</dl>
												</dd>
											</div>
										{/if}
									</dl>
								{/if}
							{/snippet}
						</EntityView>
					</li>
				{/if}
				<li>
					<dl data-definition-list="vertical">
						<div>
							<dt>Bytes</dt>
							<dd>{byteCount}</dd>
						</div>
					</dl>
				</li>
			</ul>
		</Collapsible>
	{:else if inputRaw.trim().length > 0}
		<p>Enter valid hex (optional <code>0x</code>). Odd-length input is trimmed to even length.</p>
	{/if}
</main>


<style>
	.visually-hidden {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}
	.calldata-result {
		list-style: none;
		padding-inline-start: 0;
	}
	.calldata-result-select {
		font-family: var(--fontFamily-monospace);
		max-width: 100%;
	}
	.calldata-result-args {
		margin: 0;
	}
	.calldata-result-arg dt {
		font-family: var(--fontFamily-monospace);
		min-inline-size: 1.5em;
	}
	.calldata-result-arg-value {
		font-family: var(--fontFamily-monospace);
		word-break: break-all;
	}
</style>
