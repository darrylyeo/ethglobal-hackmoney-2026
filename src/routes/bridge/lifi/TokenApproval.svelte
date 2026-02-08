<script lang="ts">
	// Types/constants
	import type { ActorAllowance$Id } from '$/data/ActorAllowance.ts'
	import type { EIP1193Provider } from '$/lib/wallet.ts'
	import { sendApproval, waitForApprovalConfirmation } from '$/api/approval.ts'
	import {
		actorAllowancesCollection,
		fetchActorAllowance,
		setActorAllowance,
		toActorAllowance$Id,
	} from '$/collections/ActorAllowances.ts'
	import { DataSource } from '$/constants/data-sources.ts'
	import { getTxUrl } from '$/constants/explorers.ts'


	// Context
	import { Button, Switch } from 'bits-ui'
	import { useLiveQuery, eq } from '@tanstack/svelte-db'
	import { registerLocalLiveQueryStack } from '$/svelte/live-query-context.svelte.ts'


	// Props
	let {
		chainId,
		tokenAddress,
		spenderAddress,
		amount,
		provider,
		ownerAddress,
	}: {
		chainId: number
		tokenAddress: `0x${string}`
		spenderAddress: `0x${string}`
		amount: bigint
		provider: EIP1193Provider
		ownerAddress: `0x${string}`,
	} = $props()


	// (Derived)
	const allowancesQuery = useLiveQuery((q) =>
		q
			.from({ row: actorAllowancesCollection })
			.where(({ row }) => eq(row.$source, DataSource.Voltaire))
			.select(({ row }) => ({ row })),
	)
	const liveQueryEntries = [
		{
			id: 'token-approval-allowances',
			label: 'Actor Allowances',
			query: allowancesQuery,
		},
	]
	registerLocalLiveQueryStack(() => liveQueryEntries)

	const allowanceId = $derived(
		toActorAllowance$Id(chainId, ownerAddress, tokenAddress, spenderAddress),
	)
	const allowanceKey = $derived(
		`${chainId}:${ownerAddress}:${tokenAddress}:${spenderAddress}`,
	)
	const allowanceRow = $derived(
		allowancesQuery.data?.find(
			(r) =>
				`${r.row.$id.chainId}:${r.row.$id.address}:${r.row.$id.tokenAddress}:${r.row.$id.spenderAddress}` ===
				allowanceKey,
		)?.row ?? null,
	)

	const isChecking = $derived(allowanceRow?.isLoading ?? true)
	const hasError = $derived(allowanceRow?.error !== null)
	const errorMessage = $derived(allowanceRow?.error ?? null)
	const hasSufficientAllowance = $derived(
		allowanceRow ? allowanceRow.allowance >= amount : false,
	)


	// State
	let txHash = $state<`0x${string}` | null>(null)
	let unlimited = $state(false)
	let isApproving = $state(false)
	let approvalError = $state<string | null>(null)


	// Actions
	$effect(() => {
		fetchActorAllowance(allowanceId).catch(() => {})
	})

	const handleApprove = async () => {
		isApproving = true
		approvalError = null
		try {
			txHash = await sendApproval(
				provider,
				chainId,
				tokenAddress,
				spenderAddress,
				amount,
				unlimited,
			)
			const ok = await waitForApprovalConfirmation(chainId, txHash)
			if (ok) {
				// Optimistically update allowance in collection
				setActorAllowance(
					allowanceId,
					unlimited
						? BigInt(
								'0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
							)
						: amount,
				)
			} else {
				approvalError = 'Transaction failed'
			}
		} catch (e) {
			approvalError = e instanceof Error ? e.message : String(e)
		} finally {
			isApproving = false
		}
	}
</script>


	{#if isChecking}
		<p data-muted>Checking approval…</p>
	{:else if isApproving}
		<p data-muted>
			Approving…
			{#if txHash}
				<a
					href={getTxUrl(chainId, txHash)}
					target="_blank"
					rel="noopener noreferrer"
				>
					View tx
				</a>
			{/if}
		</p>
	{:else if approvalError}
		<div data-column="gap-2">
			<p data-error>{approvalError}</p>
			<Button.Root onclick={handleApprove}>Retry</Button.Root>
		</div>
	{:else if hasError}
		<div data-column="gap-2">
			<p data-error>{errorMessage ?? 'Failed to check approval'}</p>
			<Button.Root onclick={() => fetchActorAllowance(allowanceId)}>
				Retry
			</Button.Root>
		</div>
	{:else if hasSufficientAllowance}
		<p class="approval-success">✓ Approved</p>
	{:else}
		<div data-column="gap-2">
			<label data-row="gap-2 align-center" data-muted>
				<Switch.Root
					bind:checked={() => unlimited, (c) => (unlimited = c)}
				>
					<Switch.Thumb />
				</Switch.Root>
				Unlimited approval
			</label>
			<Button.Root onclick={handleApprove}>Approve USDC</Button.Root>
		</div>
	{/if}


<style>
	.approval-success {
		color: var(--color-success);
	}
</style>
