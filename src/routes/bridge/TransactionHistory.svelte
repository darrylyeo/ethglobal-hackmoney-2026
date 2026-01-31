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
	<section data-tx-history aria-labelledby="tx-history-heading">
		<button
			type="button"
			data-tx-history-trigger
			aria-expanded={open}
			aria-controls="tx-history-list"
			id="tx-history-heading"
			onclick={() => (open = !open)}
		>
			Transaction history
			<span data-tx-history-count>({list.length})</span>
			{#if hasPending}
				<span data-tx-history-pending aria-hidden="true"></span>
			{/if}
		</button>
		{#if open}
			<ol id="tx-history-list" data-tx-history-list>
				{#each sorted as tx (tx.id)}
					<li data-tx-history-item data-status={tx.status}>
						<span data-tx-history-date>{formatDate(tx.createdAt)}</span>
						<span data-tx-history-chains>
							{networksByChainId[tx.fromChainId]?.name ?? tx.fromChainId}
							→
							{networksByChainId[tx.toChainId]?.name ?? tx.toChainId}
						</span>
						<span data-tx-history-amount>
							{formatTokenAmount(tx.fromAmount, 6)} USDC
						</span>
						<span data-tx-history-status>
							{#if tx.status === 'pending'}
								<span data-tx-history-spinner aria-hidden="true"></span>
								Pending
							{:else if tx.status === 'completed'}
								Completed
							{:else}
								Failed
							{/if}
						</span>
						<span data-tx-history-links>
							<a
								href={getTxUrl(tx.fromChainId, tx.sourceTxHash)}
								target="_blank"
								rel="noopener noreferrer"
							>
								Source
							</a>
							{#if tx.destTxHash}
								<a
									href={getTxUrl(tx.toChainId, tx.destTxHash)}
									target="_blank"
									rel="noopener noreferrer"
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
		margin-top: 1em;
		border: 1px solid var(--color-border);
		border-radius: 0.5em;
		overflow: hidden;
	}

	[data-tx-history-trigger] {
		display: flex;
		align-items: center;
		gap: 0.5em;
		width: 100%;
		padding: 0.75em 1em;
		background: var(--color-bg-page);
		border: none;
		font: inherit;
		text-align: left;
		cursor: pointer;
	}

	[data-tx-history-trigger]:hover {
		background: var(--color-bg-hover, rgba(0, 0, 0, 0.04));
	}

	[data-tx-history-count] {
		opacity: 0.7;
		font-size: 0.9em;
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

	[data-tx-history-date] {
		opacity: 0.8;
		white-space: nowrap;
	}

	[data-tx-history-chains] {
		opacity: 0.9;
	}

	[data-tx-history-amount] {
		font-variant-numeric: tabular-nums;
		font-weight: 500;
	}

	[data-tx-history-status] {
		display: inline-flex;
		align-items: center;
		gap: 0.25em;
	}

	[data-tx-history-item][data-status='completed'] [data-tx-history-status] {
		color: var(--color-success, #22c55e);
	}

	[data-tx-history-item][data-status='failed'] [data-tx-history-status] {
		color: var(--color-error, #ef4444);
	}

	[data-tx-history-links] {
		display: flex;
		gap: 0.5em;
	}

	[data-tx-history-links] a {
		color: var(--color-link);
		text-decoration: none;
	}

	[data-tx-history-links] a:hover {
		text-decoration: underline;
	}
</style>
