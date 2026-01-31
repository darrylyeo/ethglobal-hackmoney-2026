<script lang="ts">
	// Types/constants
	import type { StoredTransaction } from '$/lib/tx-history'
	import { getTxUrl } from '$/constants/explorers'
	import { networksByChainId } from '$/constants/networks'
	import { formatTokenAmount } from '$/lib/format'
	import { getTransactions } from '$/lib/tx-history'

	// Props
	let { address }: { address: `0x${string}` | null } = $props()

	// State
	let list = $state<StoredTransaction[]>([])
	let open = $state(false)

	$effect(() => {
		if (!address) {
			list = []
			return
		}
		list = getTransactions(address)
	})

	$effect(() => {
		if (!address) return
		const id = setInterval(() => {
			list = getTransactions(address)
		}, 8000)
		return () => clearInterval(id)
	})

	const sorted = $derived([...list].sort((a, b) => b.createdAt - a.createdAt))
	const hasPending = $derived(list.some((t) => t.status === 'pending'))
	const formatDate = (ts: number) =>
		new Date(ts).toLocaleString(undefined, {
			dateStyle: 'short',
			timeStyle: 'short',
		})
</script>

{#if address}
	<section data-tx-history data-card="secondary" aria-labelledby="tx-history-heading">
		<button
			type="button"
			data-tx-history-trigger
			data-row="gap-2 align-center"
			aria-expanded={open}
			aria-controls="tx-history-list"
			id="tx-history-heading"
			onclick={() => (open = !open)}
		>
			Transaction history
			<span data-muted>({list.length})</span>
			{#if hasPending}
				<span data-tx-history-pending aria-hidden="true"></span>
			{/if}
		</button>
		{#if open}
			<ol id="tx-history-list" data-tx-history-list>
				{#each sorted as tx (tx.id)}
					<li data-tx-history-item data-status={tx.status}>
						<span data-tx-history-date data-muted>{formatDate(tx.createdAt)}</span>
						<span data-tx-history-chains>
							{networksByChainId[tx.fromChainId]?.name ?? tx.fromChainId}
							→
							{networksByChainId[tx.toChainId]?.name ?? tx.toChainId}
						</span>
						<span data-tx-history-amount data-tabular>
							{formatTokenAmount(tx.fromAmount, 6)} USDC
						</span>
						<span data-tx-history-status data-row="gap-1 align-center">
							{#if tx.status === 'pending'}
								<span data-tx-history-spinner aria-hidden="true"></span>
								Pending
							{:else if tx.status === 'completed'}
								Completed
							{:else}
								Failed
							{/if}
						</span>
						<span data-tx-history-links data-row="gap-2">
							<a
								href={getTxUrl(tx.fromChainId, tx.sourceTxHash)}
								target="_blank"
								rel="noopener noreferrer"
								data-link
							>
								Source
							</a>
							{#if tx.destTxHash}
								<a
									href={getTxUrl(tx.toChainId, tx.destTxHash)}
									target="_blank"
									rel="noopener noreferrer"
									data-link
								>
									Destination
								</a>
							{/if}
						</span>
					</li>
				{/each}
			</ol>
		{/if}
	</section>
{/if}

<style>
	[data-tx-history] {
		overflow: hidden;
	}

	[data-tx-history-trigger] {
		width: 100%;
		background: var(--color-bg-page);
		border: none;
		text-align: left;
	}

	[data-tx-history-trigger]:hover {
		background: var(--color-bg-hover, rgba(0, 0, 0, 0.04));
	}

	[data-tx-history-pending],
	[data-tx-history-spinner] {
		display: inline-block;
		width: 0.75em;
		height: 0.75em;
		border: 2px solid var(--color-spinner-track, #e5e7eb);
		border-top-color: var(--color-spinner, currentColor);
		border-radius: 50%;
		animation: tx-history-spin 0.8s linear infinite;
	}

	@keyframes tx-history-spin {
		to {
			transform: rotate(360deg);
		}
	}

	[data-tx-history-list] {
		list-style: none;
		margin: 0;
		padding: 0;
		border-top: 1px solid var(--color-border);
		max-height: 20em;
		overflow-y: auto;
	}

	[data-tx-history-item] {
		display: grid;
		grid-template-columns: auto 1fr auto auto auto;
		align-items: center;
		gap: 0.75em;
		padding: 0.5em 1em;
		font-size: 0.875em;
		border-bottom: 1px solid var(--color-border);
	}

	[data-tx-history-item]:last-child {
		border-bottom: none;
	}

	[data-tx-history-item][data-status='completed'] [data-tx-history-status] {
		color: var(--color-success, #22c55e);
	}

	[data-tx-history-item][data-status='failed'] [data-tx-history-status] {
		color: var(--color-error, #ef4444);
	}
</style>
