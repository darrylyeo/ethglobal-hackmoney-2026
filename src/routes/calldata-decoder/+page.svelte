<script lang="ts">
	// Types/constants
	import { goto } from '$app/navigation'
	import { page } from '$app/stores'
	import {
		ensureEventSignatures,
		ensureFunctionSignatures,
		selectorSignaturesCollection,
	} from '$/collections/SelectorSignatures.ts'
	import { SelectorKind } from '$/data/SelectorSignature.ts'
	import {
		decodeCalldataWithSignature,
		decodeEventDataWithSignature,
		formatDecodedParamValue,
	} from '$/lib/calldata-decode.ts'
	import { and, eq, useLiveQuery } from '@tanstack/svelte-db'


	// State
	let inputRaw = $state('')

	function hexFromParam(value: string | null): string {
		if (!value) return ''
		const s = value.trim().replace(/^0x/i, '').replace(/\s/g, '')
		if (!/^[0-9a-fA-F]*$/.test(s)) return ''
		const even = s.length % 2 === 0 ? s : s.slice(0, -1)
		return even ? `0x${even}` : ''
	}
	let selectedSigIndex = $state(0)
	let selectedEventSigIndex = $state(0)


	// (Derived)
	const hexNormalized = $derived(
		(() => {
			const s = inputRaw.trim().replace(/^0x/i, '').replace(/\s/g, '')
			if (s.length === 0) return ''
			if (!/^[0-9a-fA-F]*$/.test(s)) return ''
			return s.length % 2 === 0 ? s : s.slice(0, -1)
		})(),
	)
	const hexWithPrefix = $derived(hexNormalized ? `0x${hexNormalized}` : '')
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
	const byteCount = $derived(hexNormalized ? Math.floor(hexNormalized.length / 2) : 0)

	const functionSigQuery = useLiveQuery(
		(q) =>
			selector
				? q
					.from({ row: selectorSignaturesCollection })
					.where(({ row }) =>
						and(
							eq(row.$id.kind, SelectorKind.Function),
							eq(row.$id.hex, selector),
						),
					)
					.select(({ row }) => ({ row }))
				: q
					.from({ row: selectorSignaturesCollection })
					.where(({ row }) => eq(row.$id.kind, '' as typeof SelectorKind.Function))
					.select(({ row }) => ({ row })),
		[() => selector],
	)
	const functionSignatures = $derived(functionSigQuery.data?.[0]?.row?.signatures ?? [])

	const eventSigQuery = useLiveQuery(
		(q) =>
			topic
				? q
					.from({ row: selectorSignaturesCollection })
					.where(({ row }) =>
						and(
							eq(row.$id.kind, SelectorKind.Event),
							eq(row.$id.hex, topic),
						),
					)
					.select(({ row }) => ({ row }))
				: q
					.from({ row: selectorSignaturesCollection })
					.where(({ row }) => eq(row.$id.kind, '' as typeof SelectorKind.Event))
					.select(({ row }) => ({ row })),
		[() => topic],
	)
	const eventSignatures = $derived(eventSigQuery.data?.[0]?.row?.signatures ?? [])

	const signatureForDecode = $derived(
		functionSignatures.length > 0
			? functionSignatures[
					Math.min(selectedSigIndex, functionSignatures.length - 1)
				]
			: null,
	)
	const decodedCall = $derived(
		hexWithPrefix && selector && signatureForDecode
			? decodeCalldataWithSignature(signatureForDecode, hexWithPrefix)
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
			? decodeEventDataWithSignature(eventSignatureForDecode, hexWithPrefix)
			: null,
	)

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
		if (selector) void ensureFunctionSignatures(selector).catch(() => {})
	})
	$effect(() => {
		if (topic) void ensureEventSignatures(topic).catch(() => {})
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
</script>

<svelte:head>
	<title>Calldata decoder</title>
</svelte:head>

<main data-card="radius-2 padding-2" style="max-width: 42rem;">
	<h1>Calldata decoder</h1>
	<p>Paste transaction input or event data (hex) to resolve the function selector (4 bytes) and/or event topic (32 bytes) to human-readable signature(s). Use <code>?data=0x…</code> in the URL to open with hex pre-filled (shareable link).</p>

	<label>
		<span class="visually-hidden">Calldata (hex)</span>
		<textarea
			bind:value={inputRaw}
			placeholder="0xa9059cbb000000000000000000000000..."
			rows="4"
			spellcheck="false"
			data-input="hex"
			style="font-family: ui-monospace, monospace; width: 100%; box-sizing: border-box;"
		></textarea>
	</label>

	{#if hexWithPrefix}
		<dl data-row="gap-1" style="margin-top: 1rem;">
			<dt>Selector (4 bytes)</dt>
			<dd><code>{selector ?? '—'}</code></dd>
			{#if functionSignatures.length > 0}
				<dt>Function signatures</dt>
				<dd>
					{#if functionSignatures.length > 1}
						<select
							bind:value={selectedSigIndex}
							aria-label="Choose function signature for decoding"
							style="font-family: ui-monospace, monospace; max-width: 100%;"
						>
							{#each functionSignatures as sig, i}
								<option value={i}>{sig}</option>
							{/each}
						</select>
					{:else}
						<code data-row="wrap gap-1">
							{#each functionSignatures as sig}
								<span>{sig}</span>
							{/each}
						</code>
					{/if}
				</dd>
				{#if decodedCall}
					<dt>Decoded arguments</dt>
					<dd>
						<code>{decodedCall.name}(</code>
						<span data-row="wrap gap-1">
							{#each decodedCall.params as param, i}
								<code>{formatDecodedParamValue(param.type, param.value)}</code>{i < decodedCall.params.length - 1 ? ', ' : ''}
							{/each}
						</span>
						<code>)</code>
					</dd>
				{/if}
			{/if}
			{#if topic}
				<dt>Topic (32 bytes)</dt>
				<dd><code>{topic}</code></dd>
				{#if eventSignatures.length > 0}
					<dt>Event signatures</dt>
					<dd>
						{#if eventSignatures.length > 1}
							<select
								bind:value={selectedEventSigIndex}
								aria-label="Choose event signature for decoding"
								style="font-family: ui-monospace, monospace; max-width: 100%;"
							>
								{#each eventSignatures as sig, i}
									<option value={i}>{sig}</option>
								{/each}
							</select>
						{:else}
							<code data-row="wrap gap-1">
								{#each eventSignatures as sig}
									<span>{sig}</span>
								{/each}
							</code>
						{/if}
					</dd>
					{#if decodedEvent}
						<dt>Decoded event args</dt>
						<dd>
							<code>{decodedEvent.name}(</code>
							<span data-row="wrap gap-1">
								{#each decodedEvent.params as param, i}
									<code>{formatDecodedParamValue(param.type, param.value)}</code>{i < decodedEvent.params.length - 1 ? ', ' : ''}
								{/each}
							</span>
							<code>)</code>
						</dd>
					{/if}
				{/if}
			{/if}
			<dt>Byte count</dt>
			<dd>{byteCount}</dd>
		</dl>
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
</style>
