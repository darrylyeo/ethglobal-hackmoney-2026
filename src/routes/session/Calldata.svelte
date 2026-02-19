<script lang="ts">
	// Types/constants
	import { describePayloadData } from '$/lib/session/payloadDisplay.ts'

	// Props
	let {
		data,
	}: {
		data?: `0x${string}`
	} = $props()


	// (Derived)
	const desc = $derived(describePayloadData({ data }))
	const summary = $derived(
		desc.kind === 'empty'
			? '—'
			: desc.kind === 'erc20_transfer'
				? `transfer(${desc.to.slice(0, 10)}…, ${desc.amount})`
				: desc.kind === 'erc20_approve'
					? `approve(${desc.spender.slice(0, 10)}…, ${desc.amount === 2n ** 256n - 1n ? 'unlimited' : desc.amount})`
					: `raw (${desc.byteLength} bytes)`,
	)
</script>

<span data-text="font-monospace">{summary}</span>
