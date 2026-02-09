<script lang="ts">
	// Types/constants
	import type { TransferEventRow } from '$/collections/TransferEvents.ts'
	import type { Coin } from '$/constants/coins.ts'


	// Props
	let {
		item,
		coin,
		formatAmount,
		formatTime,
		coinIconSrc,
	}: {
		item: TransferEventRow
		coin: Coin
		formatAmount: (amount: string) => string
		formatTime: (ts: number) => string
		coinIconSrc?: string
	} = $props()


	// State
	let fromRef = $state<HTMLElement | null>(null)
	let toRef = $state<HTMLElement | null>(null)
	let articleRef = $state<HTMLElement | null>(null)
	let arrowRects = $state<{ from: DOMRect; to: DOMRect } | null>(null)

	$effect(() => {
		if (!fromRef || !toRef || !articleRef) { arrowRects = null; return }
		const containerRect = articleRef.getBoundingClientRect()
		const fromRect = fromRef.getBoundingClientRect()
		const toRect = toRef.getBoundingClientRect()
		arrowRects = {
			from: new DOMRect(
				fromRect.left - containerRect.left,
				fromRect.top - containerRect.top,
				fromRect.width,
				fromRect.height,
			),
			to: new DOMRect(
				toRect.left - containerRect.left,
				toRect.top - containerRect.top,
				toRect.width,
				toRect.height,
			),
		}
	})


	// Components
	import FlowArrow from '$/components/FlowArrow.svelte'
</script>


<article
	bind:this={articleRef}
	data-card="radius-2 padding-2"
	data-column="gap-2"
	class="transfer-event-row"
>
	<dl data-row="wrap gap-2">
		<dt>Tx</dt>
		<dd>
			<code>
				{item.transactionHash.slice(0, 10)}…{item.transactionHash.slice(-8)}
			</code>
		</dd>
		<dt>From</dt>
		<dd bind:this={fromRef}><code>{item.fromAddress.slice(0, 10)}…</code></dd>
		<dt>To</dt>
		<dd bind:this={toRef}><code>{item.toAddress.slice(0, 10)}…</code></dd>
		<dt>Amount</dt>
		<dd>{formatAmount(item.amount)} {coin.symbol}</dd>
		<dt>Time</dt>
		<dd>{formatTime(item.timestamp)}</dd>
	</dl>

	{#if arrowRects}
		<FlowArrow
			sourceRect={arrowRects.from}
			targetRect={arrowRects.to}
			gap={2}
			arrowHeadSize={6}
			strokeWidth={1}
			strokeColor="var(--color-accent)"
			flowIconSrc={Number(item.amount) > 0 ? coinIconSrc : undefined}
			flowIconSize={14}
			relative
		/>
	{/if}
</article>


<style>
	.transfer-event-row {
		position: relative;
	}
</style>
