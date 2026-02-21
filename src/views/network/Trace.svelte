<script lang="ts">
	// Types/constants
	import type { ChainId } from '$/constants/networks.ts'
	import type { Trace as TraceType } from '$/data/Trace.ts'
	import {
		ensureFunctionSignatures,
		selectorSignaturesCollection,
	} from '$/collections/SelectorSignatures.ts'
	import { SelectorKind } from '$/data/SelectorSignature.ts'
	import { formatWei, formatGas } from '$/lib/format.ts'
	import { and, eq, useLiveQuery } from '@tanstack/svelte-db'


	// Props
	let {
		trace,
		chainId,
	}: {
		trace: TraceType
		chainId: ChainId
	} = $props()


	// (Derived)
	const inputSelector = $derived(
		trace.input && trace.input.length >= 10
			? (`0x${trace.input.slice(2, 10).toLowerCase().padStart(8, '0')}` as `0x${string}`)
			: null,
	)


	// Context
	const functionSigQuery = useLiveQuery(
		(q) =>
			inputSelector
				? q
					.from({ row: selectorSignaturesCollection })
					.where(({ row }) =>
						and(
							eq(row.$id.kind, SelectorKind.Function),
							eq(row.$id.hex, inputSelector),
						),
					)
					.select(({ row }) => ({ row }))
				: q
					.from({ row: selectorSignaturesCollection })
					.where(({ row }) => eq(row.$id.kind, '' as typeof SelectorKind.Function))
					.select(({ row }) => ({ row })),
		[() => inputSelector],
	)


	// (Derived)
	const functionSignatures = $derived(functionSigQuery.data?.[0]?.row?.signatures ?? [])


	// Actions
	$effect(() => {
		if (inputSelector) void ensureFunctionSignatures(inputSelector).catch(() => {})
	})


	// Components
	import TruncatedValue from '$/components/TruncatedValue.svelte'
	import Address from '$/views/Address.svelte'
	import Self from '$/views/network/Trace.svelte'
</script>


<details data-card="radius-2 padding-2" id="trace:{trace.index}">
	<summary>
		<div data-row="wrap gap-2 align-center">
			{#if trace.type}
				<code>{trace.type.toUpperCase()}</code>
			{/if}
			<span>#{trace.index}</span>
			{#if trace.to}
				<TruncatedValue value={trace.to} startLength={10} endLength={4} />
			{/if}
			{#if trace.error}
				<span data-tag="failure">⚠ {trace.error}</span>
			{/if}
		</div>
	</summary>

	<dl>
		{#if trace.from}
			<dt>From</dt>
			<dd><Address network={chainId} address={trace.from as `0x${string}`} /></dd>
		{/if}

		{#if trace.to}
			<dt>To</dt>
			<dd><Address network={chainId} address={trace.to as `0x${string}`} /></dd>
		{/if}

		{#if trace.value && trace.value !== '0x0' && trace.value !== '0x'}
			<dt>Value</dt>
			<dd>{formatWei(trace.value)} ETH</dd>
		{/if}

		{#if trace.gas != null}
			<dt>Gas</dt>
			<dd>{formatGas(trace.gas)}</dd>
		{/if}

		{#if trace.gasUsed != null}
			<dt>Gas Used</dt>
			<dd>{formatGas(trace.gasUsed)}</dd>
		{/if}

		{#if trace.input && trace.input !== '0x'}
			<dt>Input</dt>
			<dd>
				{#if functionSignatures.length > 0}
					<code data-row="wrap gap-1">
						{#each functionSignatures as sig}
							<span>{sig}</span>
						{/each}
					</code>
					<span> · </span>
				{/if}
				<TruncatedValue value={trace.input} startLength={10} endLength={0} />
				<span>({Math.max(0, (trace.input.length - 2) / 2)} bytes)</span>
			</dd>
		{/if}

		{#if trace.output && trace.output !== '0x'}
			<dt>Output</dt>
			<dd><TruncatedValue value={trace.output} startLength={10} endLength={8} /></dd>
		{/if}
	</dl>

	{#if trace.children?.length}
		<ul data-column="gap-2">
			{#each trace.children as child (child.index)}
				<li>
					<Self trace={child} {chainId} />
				</li>
			{/each}
		</ul>
	{/if}
</details>
