<script lang="ts">
	// Types/constants
	import { Popover } from 'bits-ui'
	import { networkStatus } from '$/api/network-status.svelte'
	import { networksByChainId } from '$/constants/networks'

	const statusColors = {
		healthy: 'var(--color-success, #22c55e)',
		degraded: 'var(--color-warning, #f59e0b)',
		down: 'var(--color-error, #ef4444)',
	}

	const statusLabels = {
		healthy: 'All systems operational',
		degraded: 'Some networks degraded',
		down: 'Network issues detected',
	}

	// (Derived)
	const degradedChains = $derived(
		[...networkStatus.status.chains.values()]
			.filter((c) => c.status !== 'healthy')
			.sort((a, b) => (a.status === 'down' ? -1 : 1)),
	)
</script>

<Popover.Root>
	<Popover.Trigger class="network-status-trigger">
		<span
			class="status-dot"
			style:background={statusColors[networkStatus.status.overall]}
			aria-label={statusLabels[networkStatus.status.overall]}
		></span>
		<span class="sr-only">Network status: {networkStatus.status.overall}</span>
	</Popover.Trigger>

	<Popover.Content class="network-status-popover">
		<h3 class="status-title">
			<span
				class="status-dot"
				style:background={statusColors[networkStatus.status.overall]}
			></span>
			{statusLabels[networkStatus.status.overall]}
		</h3>

		<div class="status-section">
			<h4>LI.FI API</h4>
			<span
				class="status-badge"
				data-status-badge={networkStatus.status.lifiApi}
			>
				{networkStatus.status.lifiApi}
			</span>
		</div>

		{#if degradedChains.length > 0}
			<div class="status-section">
				<h4>Affected Networks</h4>
				<ul class="status-chains">
					{#each degradedChains as chain (chain.chainId)}
						<li>
							<span
								>{networksByChainId[chain.chainId]?.name ??
									`Chain ${chain.chainId}`}</span
							>
							<span
								class="status-badge"
								data-status-badge={chain.status}
							>
								{chain.status}
								{#if chain.latencyMs}
									({chain.latencyMs}ms)
								{/if}
							</span>
						</li>
					{/each}
				</ul>
			</div>
		{:else}
			<p class="status-all-healthy">
				All {networkStatus.status.chains.size} networks healthy
			</p>
		{/if}

		<p class="status-updated">
			Last updated: {new Date(
				networkStatus.status.lastUpdated,
			).toLocaleTimeString()}
		</p>
	</Popover.Content>
</Popover.Root>

<style>
	:global(.network-status-trigger) {
		display: flex;
		align-items: center;
		gap: 0.25em;
		padding: 0.5em;
		background: none;
		border: none;
		cursor: pointer;
	}

	.status-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		flex-shrink: 0;
	}

	:global(.network-status-popover) {
		width: 280px;
		padding: 1em;
	}

	:global(.network-status-popover) .status-title {
		display: flex;
		align-items: center;
		gap: 0.5em;
		margin-bottom: 1em;
		font-size: 0.875em;
	}

	:global(.network-status-popover) .status-section {
		margin: 0.75em 0;
	}

	:global(.network-status-popover) .status-section h4 {
		font-size: 0.75em;
		text-transform: uppercase;
		opacity: 0.7;
		margin-bottom: 0.5em;
	}

	:global(.network-status-popover) .status-chains {
		list-style: none;
		padding: 0;
		margin: 0;
	}

	:global(.network-status-popover) .status-chains li {
		display: flex;
		justify-content: space-between;
		font-size: 0.875em;
		padding: 0.25em 0;
	}

	.status-badge {
		font-size: 0.75em;
		padding: 0.125em 0.375em;
		border-radius: 0.25em;
		text-transform: capitalize;

		&[data-status-badge='healthy'] {
			background: var(--color-success-bg, #dcfce7);
			color: var(--color-success, #22c55e);
		}

		&[data-status-badge='degraded'] {
			background: var(--color-warning-bg, #fef3c7);
			color: var(--color-warning, #d97706);
		}

		&[data-status-badge='down'] {
			background: var(--color-error-bg, #fef2f2);
			color: var(--color-error, #dc2626);
		}
	}

	.status-all-healthy {
		font-size: 0.875em;
		opacity: 0.8;
	}

	.status-updated {
		font-size: 0.75em;
		opacity: 0.5;
		margin-top: 1em;
		text-align: right;
	}
</style>
