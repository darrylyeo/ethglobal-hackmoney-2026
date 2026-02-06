<script lang="ts">
	// Types/constants
	import type { EIP1193Provider } from '$/lib/wallet'
	import { DataSource } from '$/constants/data-sources'


	// Props
	let { provider }: { provider: EIP1193Provider | null } = $props()


	// State
	import { useLiveQuery, eq } from '@tanstack/svelte-db'
	import { registerLocalLiveQueryStack } from '$/svelte/live-query-context.svelte'
	import { yellowDepositsCollection } from '$/collections/yellow-deposits'
	import { yellowState } from '$/state/yellow.svelte'
	import { depositToCustody, withdrawFromCustody } from '$/api/yellow'
	import { parseDecimalToSmallest, formatSmallestToDecimal } from '$/lib/format'

	const depositQuery = useLiveQuery((q) =>
		q
			.from({ row: yellowDepositsCollection })
			.where(({ row }) => eq(row.$source, DataSource.Yellow))
			.select(({ row }) => ({ row })),
	)
	const liveQueryEntries = [
		{
			id: 'yellow-deposits',
			label: 'Yellow Deposits',
			query: depositQuery,
		},
	]
	registerLocalLiveQueryStack(() => liveQueryEntries)

	const depositRow = $derived(
		yellowState.chainId && yellowState.address
			? (depositQuery.data ?? [])
					.map((r) => r.row)
					.find(
						(d) =>
							d.chainId === yellowState.chainId &&
							d.address.toLowerCase() === yellowState.address!.toLowerCase(),
					)
			: null,
	)
	const availableBalance = $derived(depositRow?.availableBalance ?? 0n)
	const lockedBalance = $derived(depositRow?.lockedBalance ?? 0n)

	let depositAmount = $state('')
	let withdrawAmount = $state('')
	let loading = $state(false)

	const handleDeposit = async () => {
		if (!provider || !yellowState.chainId) return
		loading = true
		try {
			await depositToCustody({
				provider,
				chainId: yellowState.chainId,
				amount: parseDecimalToSmallest(depositAmount, 6),
			})
			depositAmount = ''
		} finally {
			loading = false
		}
	}

	const handleWithdraw = async () => {
		if (!provider || !yellowState.chainId) return
		loading = true
		try {
			await withdrawFromCustody({
				provider,
				chainId: yellowState.chainId,
				amount: parseDecimalToSmallest(withdrawAmount, 6),
			})
			withdrawAmount = ''
		} finally {
			loading = false
		}
	}
</script>


<section class="deposit-manager">
	<h3>Custody Balance</h3>

	<dl>
		<dt>Available</dt>
		<dd>{formatSmallestToDecimal(availableBalance, 6)} USDC</dd>

		<dt>Locked in channels</dt>
		<dd>{formatSmallestToDecimal(lockedBalance, 6)} USDC</dd>
	</dl>

	<form
		data-row="gap-2"
		onsubmit={(e) => {
			e.preventDefault()
			handleDeposit()
		}}
	>
		<input
			type="text"
			placeholder="Deposit amount"
			bind:value={depositAmount}
			inputmode="decimal"
		/>
		<button type="submit" disabled={loading}>Deposit</button>
	</form>

	<form
		data-row="gap-2"
		onsubmit={(e) => {
			e.preventDefault()
			handleWithdraw()
		}}
	>
		<input
			type="text"
			placeholder="Withdraw amount"
			bind:value={withdrawAmount}
			inputmode="decimal"
		/>
		<button type="submit" disabled={loading}>Withdraw</button>
	</form>
</section>


<style>
	.deposit-manager h3 {
		margin-bottom: 0.5rem;
	}
	.deposit-manager dl {
		margin: 0.5rem 0;
	}
	.deposit-manager form {
		margin: 0.5rem 0;
	}
</style>
