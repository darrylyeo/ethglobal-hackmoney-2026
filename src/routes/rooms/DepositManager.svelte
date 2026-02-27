<script lang="ts">
	// Types/constants
	import type { EIP1193Provider } from '$/lib/wallet.ts'
	import { DataSource } from '$/constants/data-sources.ts'
	import { getUsdcAddress } from '$/api/lifi.ts'
	import { depositToCustody, withdrawFromCustody } from '$/api/yellow.ts'
	import { stateChannelDepositsCollection } from '$/collections/StateChannelDeposits.ts'
	import { parseDecimalToSmallest, formatSmallestToDecimal } from '$/lib/format.ts'
	import { yellowState } from '$/state/yellow.svelte.ts'
	import { registerLocalLiveQueryStack } from '$/svelte/live-query-context.svelte.ts'
	import { eq, useLiveQuery } from '@tanstack/svelte-db'


	// Props
	let {
		provider,
	}: {
		provider: EIP1193Provider | null
	} = $props()


	// Context
	const depositQuery = useLiveQuery((q) =>
		q
			.from({ row: stateChannelDepositsCollection })
			.select(({ row }) => ({ row })),
	)
	registerLocalLiveQueryStack(() => [
		{
			id: 'yellow-deposits',
			label: 'Yellow Deposits',
			query: depositQuery,
		},
	])


	// (Derived)
	const depositRow = $derived(
		yellowState.chainId && yellowState.address
			? (depositQuery.data ?? [])
					.map(({ row }) => row)
					.find(
						(d) =>
							d.chainId === yellowState.chainId &&
							d.address.toLowerCase() === yellowState.address!.toLowerCase(),
					)
			: null,
	)
	const availableBalance = $derived(depositRow?.availableBalance ?? 0n)
	const lockedBalance = $derived(depositRow?.lockedBalance ?? 0n)


	// State
	let depositAmount = $state('')
	let withdrawAmount = $state('')
	let loading = $state(false)


	// Actions
	const onDeposit = async () => {
		if (!provider || !yellowState.chainId) return
		loading = true
		try {
			await depositToCustody({
				provider,
				chainId: yellowState.chainId,
				token: getUsdcAddress(yellowState.chainId),
				amount: parseDecimalToSmallest(depositAmount, 6),
			})
			depositAmount = ''
		} finally {
			loading = false
		}
	}
	const onWithdraw = async () => {
		if (!provider || !yellowState.chainId) return
		loading = true
		try {
			await withdrawFromCustody({
				provider,
				chainId: yellowState.chainId,
				token: getUsdcAddress(yellowState.chainId),
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
		data-row
		onsubmit={(e) => {
			e.preventDefault()
			onDeposit()
		}}
	>
		<input
			type="text"
			data-text="font-monospace"
			placeholder="Deposit amount"
			bind:value={depositAmount}
			inputmode="decimal"
		/>
		<button
			type="submit"
			disabled={loading}
		>
			Deposit
		</button>
	</form>

	<form
		data-row
		onsubmit={(e) => {
			e.preventDefault()
			onWithdraw()
		}}
	>
		<input
			type="text"
			data-text="font-monospace"
			placeholder="Withdraw amount"
			bind:value={withdrawAmount}
			inputmode="decimal"
		/>
		<button
			type="submit"
			disabled={loading}
		>
			Withdraw
		</button>
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
