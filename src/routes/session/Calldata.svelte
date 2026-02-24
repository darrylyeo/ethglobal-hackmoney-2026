<script lang="ts">
	// Types/constants
	import {
		ensureEvmFunctionSignatures,
		evmSelectorsCollection,
		normalizeEvmSelector4,
	} from '$/collections/EvmSelectors.ts'
	import { describePayloadData } from '$/lib/session/payloadDisplay.ts'
	import { eq, useLiveQuery } from '@tanstack/svelte-db'


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
			? normalizeEvmSelector4(selector)
			: null,
	)
	const sigQuery = useLiveQuery(
		(q) =>
			normalizedSelector
				? q
					.from({ row: evmSelectorsCollection })
					.where(({ row }) => eq(row.$id.hex, normalizedSelector))
					.select(({ row }) => ({ row }))
				: q
					.from({ row: evmSelectorsCollection })
					.where(({ row }) => eq(row.$id.hex, '0x' as `0x${string}`))
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
		if (normalizedSelector) void ensureEvmFunctionSignatures(normalizedSelector)
	})
</script>

<span data-text="font-monospace">{summary}</span>
