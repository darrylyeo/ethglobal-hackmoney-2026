<script lang="ts">
	// Types/constants
	import type { NetworkConfig } from '$/constants/networks'

	// Props
	let {
		data,
	}: {
		data: {
			nameParam: string
			chainId: number
			config: NetworkConfig
			slug: string
			caip2: string
		}
	} = $props()

	// (Derived)
	const explorerBlockListUrl = $derived(
		data.config.explorerUrl ? `${data.config.explorerUrl}/blocks` : null,
	)
</script>

<svelte:head>
	<title>{data.config.name} · Network</title>
</svelte:head>

<div data-column="gap-2">
	<header class="network-header">
		<h1>Network</h1>
		<div class="network-identity" data-row="gap-2 align-center">
			<code class="caip2">{data.caip2}</code>
			<span class="network-name">{data.config.name}</span>
			<span class="network-type" data-tag={data.config.type}>
				{data.config.type}
			</span>
		</div>
		<p class="network-meta">
			Chain ID {data.chainId}
			{#if data.config.nativeCurrency}
				· {data.config.nativeCurrency.symbol}
			{/if}
		</p>
	</header>

	<nav class="network-actions" data-row="wrap gap-2">
		{#if data.config.explorerUrl}
			<a
				href={explorerBlockListUrl ?? ''}
				target="_blank"
				rel="noopener noreferrer"
				class="action-link"
			>
				Blocks
			</a>
			<a
				href={data.config.explorerUrl}
				target="_blank"
				rel="noopener noreferrer"
				class="action-link"
			>
				Explorer
			</a>
		{/if}
	</nav>
</div>

<style>
	.network-header {
		display: grid;
		gap: 0.5rem;
	}

	.network-identity {
		font-size: 1rem;
	}

	.network-identity code.caip2 {
		font-family: ui-monospace, monospace;
		opacity: 0.85;
	}

	.network-name {
		font-weight: 600;
	}

	.network-type[data-tag='Testnet'] {
		opacity: 0.8;
		font-size: 0.85em;
	}

	.network-meta {
		margin: 0;
		font-size: 0.9em;
		opacity: 0.85;
	}

	.network-actions .action-link {
		font-size: 0.9em;
		padding: 0.25rem 0.5rem;
		border-radius: 0.25rem;
		border: 1px solid var(--color-border);
		background: var(--color-bg-subtle);
		color: inherit;
		text-decoration: none;
	}

	.network-actions .action-link:hover {
		background: var(--color-border);
	}
</style>
