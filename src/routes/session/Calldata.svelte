<script lang="ts">
	// Types/constants
	import {
		ensureFunctionSignatures,
		normalizeSelector4,
		selectorSignaturesCollection,
	} from '$/collections/SelectorSignatures.ts'
	import { SelectorKind } from '$/data/SelectorSignature.ts'
	import { describePayloadData } from '$/lib/session/payloadDisplay.ts'
	import { and, eq, not, useLiveQuery } from '@tanstack/svelte-db'


	// Props
	let {
		data,
	}: {
		data?: `0x${string}`
	} = $props()


	// (Derived)
	const desc = $derived(describePayloadData({ data }))
	const selector = $derived(
		(data?.length ?? 0) >= 10
			? (data!.slice(0, 10) as `0x${string}`)
			: null,
	)
	const normalizedSelector = $derived(
		selector
			? normalizeSelector4(selector)
			: null,
	)
	const sigQuery = useLiveQuery(
		(q) =>
			normalizedSelector
				? q
						.from({ row: selectorSignaturesCollection })
						.where(({ row }) =>
							and(
								eq(row.$id.kind, SelectorKind.Function),
								eq(row.$id.hex, normalizedSelector!),
							),
						)
						.select(({ row }) => ({ row }))
				: q
						.from({ row: selectorSignaturesCollection })
						.where(({ row }) =>
							and(
								eq(row.$id.hex, '0x' as `0x${string}`),
								not(eq(row.$id.hex, '0x' as `0x${string}`)),
							),
						)
						.select(({ row }) => ({ row })),
			[() => normalizedSelector],
	)
	const signatures = $derived(sigQuery.data?.[0]?.row?.signatures ?? [])
	const summary = $derived(
		desc.kind === 'empty'
			? '—'
			: desc.kind === 'erc20_transfer'
				? `transfer(${desc.to.slice(0, 10)}…, ${desc.amount})`
				: desc.kind === 'erc20_approve'
					? `approve(${desc.spender.slice(0, 10)}…, ${desc.amount === 2n ** 256n - 1n
						? 'unlimited'
						: desc.amount})`
					: signatures.length > 0
						? signatures[0]
						: `raw (${desc.byteLength} bytes)`,
	)


	// Actions
	$effect(() => {
		if (normalizedSelector) void ensureFunctionSignatures(normalizedSelector)
	})
</script>

<span data-text="font-monospace">{summary}</span>
