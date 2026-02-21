<script lang="ts">
	// Types/constants
	import type { ForkUpgrade } from '$/constants/fork-upgrades.ts'
	import type { ProposalEntry } from '$/data/ProposalEntry.ts'
	import { proposalsCollection } from '$/collections/Proposals.ts'
	import {
		EIPS_OFFICIAL_BASE,
		FORK_UPGRADES,
	} from '$/constants/fork-upgrades.ts'
	import { useLiveQuery } from '@tanstack/svelte-db'


	// Context
	const entriesQuery = useLiveQuery((q) =>
		q
			.from({ row: proposalsCollection })
			.select(({ row }) => ({ row })),
	)


	// (Derived)
	const entriesByNumber = $derived(
		new Map<number, ProposalEntry>(
			(entriesQuery.data ?? []).map((r) => {
				const row = r.row as ProposalEntry
				return [row.number, row]
			}),
		),
	)


	// Functions
	const formatActivation = (f: ForkUpgrade) =>
		f.activationBlock != null
			? `Block ${f.activationBlock.toLocaleString()}`
			: f.activationTimestamp != null
				? new Date(f.activationTimestamp * 1000).toISOString().slice(0, 10)
				: null
</script>

<svelte:head>
	<title>Fork upgrades</title>
</svelte:head>

<main data-column="gap-6">
	<h1>Fork upgrades</h1>
	<p>
		Ethereum mainnet protocol upgrades and their included EIPs. See
		<a href="https://ethereum.org/ethereum-forks/" target="_blank" rel="noopener noreferrer">
			ethereum.org fork timeline
		</a>
		,
		<a href="https://github.com/ethereum/execution-specs/tree/master/network-upgrades/mainnet-upgrades" target="_blank" rel="noopener noreferrer">
			execution-specs
		</a>
		,
		<a href="https://forkcast.org" target="_blank" rel="noopener noreferrer">
			Forkcast
		</a>
		. <a href="/eips">Browse all EIPs / ERCs</a>.
	</p>

	<ul data-column="gap-6" role="list">
		{#each FORK_UPGRADES as fork (fork.slug)}
			<li id={fork.slug} data-card="radius-2 padding-4">
				<div data-column="gap-2">
					<h2>{fork.name}</h2>
					{#if formatActivation(fork)}
						<p data-text="annotation">{formatActivation(fork)}</p>
					{/if}
					<dl data-row="gap-4 wrap">
						{#if fork.links.ethereumOrg}
							<div>
								<dt class="sr-only">ethereum.org</dt>
								<dd>
									<a
										href={fork.links.ethereumOrg}
										target="_blank"
										rel="noopener noreferrer"
										data-link
									>
										ethereum.org
									</a>
								</dd>
							</div>
						{/if}
						{#if fork.links.executionSpecs}
							<div>
								<dt class="sr-only">Execution specs</dt>
								<dd>
									<a
										href={fork.links.executionSpecs}
										target="_blank"
										rel="noopener noreferrer"
										data-link
									>
										execution-specs
									</a>
								</dd>
							</div>
						{/if}
						{#if fork.links.consensusSpecs}
							<div>
								<dt class="sr-only">Consensus specs</dt>
								<dd>
									<a
										href={fork.links.consensusSpecs}
										target="_blank"
										rel="noopener noreferrer"
										data-link
									>
										consensus-specs
									</a>
								</dd>
							</div>
						{/if}
						{#if fork.links.forkcast}
							<div>
								<dt class="sr-only">Forkcast</dt>
								<dd>
									<a
										href={fork.links.forkcast}
										target="_blank"
										rel="noopener noreferrer"
										data-link
									>
										Forkcast
									</a>
								</dd>
							</div>
						{/if}
					</dl>
					{#if fork.eipNumbers.length > 0}
						<div>
							<h3>Included EIPs</h3>
							<ul data-row="gap-2 wrap" role="list">
								{#each fork.eipNumbers as num (num)}
									{@const entry = entriesByNumber.get(num)}
									<li>
										<a
											href={`${EIPS_OFFICIAL_BASE}${num}`}
											target="_blank"
											rel="noopener noreferrer"
											data-link
										>
											EIP-{num}
											{#if entry}
												— {entry.title}
											{/if}
										</a>
									</li>
								{/each}
							</ul>
						</div>
					{:else}
						<p data-text="muted">No EIPs listed for this fork.</p>
					{/if}
				</div>
			</li>
		{/each}
	</ul>
</main>

<style>
	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}
</style>
