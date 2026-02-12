<script lang="ts">
	// Types/constants
	import type { TransferEventRow } from '$/collections/TransferEvents.ts'
	import type { Coin } from '$/constants/coins.ts'
	import { getCoinIconUrl } from '$/lib/coin-icon.ts'
	import TransferEventRowView from '$/views/TransferEventRow.svelte'


	// Props
	let {
		item,
		coin,
		symbol,
	}: {
		item: TransferEventRow
		coin: Coin
		symbol: string
	} = $props()


	// State
	let coinIconSrc = $state<string | undefined>(undefined)
	$effect(() => {
		getCoinIconUrl(symbol).then((url) => { coinIconSrc = url })
	})


	// Functions
	function formatAmount(amount: string): string {
		const n = Number(amount) / 1e6
		return n.toLocaleString(undefined, {
			minimumFractionDigits: 0,
			maximumFractionDigits: 4,
		})
	}
	function formatTime(ts: number): string {
		return new Date(ts).toLocaleString(undefined, {
			dateStyle: 'short',
			timeStyle: 'short',
		})
	}
</script>


<TransferEventRowView
	{item}
	{coin}
	{formatAmount}
	{formatTime}
	{coinIconSrc}
/>
