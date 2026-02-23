<script lang="ts">
	// Types/constants
	import type { Fork } from '$/constants/forks/index.ts'
	import type { ProposalEntry } from '$/data/ProposalEntry.ts'
	import { EntityType } from '$/data/$EntityType.ts'
	import { EntityLayout } from '$/components/EntityView.svelte'
	import { proposalsCollection } from '$/collections/Proposals.ts'
	import {
		dateFromUnixSeconds,
		mainnetForksWithUpgrades,
	} from '$/constants/forks/index.ts'
	import { getProposalPath, ProposalRealm } from '$/lib/proposal-paths.ts'
	import { useLiveQuery } from '@tanstack/svelte-db'

	// Context
	import { resolve } from '$app/paths'

	// (Derived)
	const entriesByNumber = $derived(
		new Map<number, ProposalEntry>(
			(useLiveQuery((q) =>
				q
					.from({ row: proposalsCollection })
					.select(({ row }) => ({ row })),
			).data ?? []).map((r) => {
				const row = r.row as ProposalEntry
				return [row.number, row]
			}),
		),
	)

	// Functions
	const formatActivation = (f: Fork) =>
		f.activation.block != null
			? `Block ${f.activation.block.toLocaleString()}`
			: dateFromUnixSeconds(f.activation.timestamp)?.toISOString().slice(0, 10) ?? null

	const forkLinkEntries = (f: Fork) =>
		f.links
			? [
					f.links.ethereumOrg && { label: 'ethereum.org', href: f.links.ethereumOrg },
					f.links.executionSpecs && {
						label: 'execution-specs',
						href: f.links.executionSpecs,
					},
					f.links.consensusSpecs && {
						label: 'consensus-specs',
						href: f.links.consensusSpecs,
					},
					f.links.forkcast && { label: 'Forkcast', href: f.links.forkcast },
				].filter((x): x is { label: string; href: string } => x != null)
			: []

	// Components
	import EntityView from '$/components/EntityView.svelte'
	import Heading from '$/components/Heading.svelte'
	import HeadingLevelProvider from '$/components/HeadingLevelProvider.svelte'
</script>

<svelte:head>
	<title>Fork upgrades</title>
</svelte:head>

<main data-column="gap-6">
	<HeadingLevelProvider>
		<header data-column>
			<Heading>Fork upgrades</Heading>
			<p data-text="annotation">
				Ethereum mainnet protocol upgrades and included EIPs.
				<a href={resolve('/proposals')} data-link>Browse all proposals</a>.
			</p>
			<nav data-row="wrap" aria-label="External resources">
				<a
					href="https://ethereum.org/ethereum-forks/"
					target="_blank"
					rel="noopener noreferrer"
					data-tag
				>
					ethereum.org timeline
				</a>
				<a
					href="https://github.com/ethereum/execution-specs/tree/master/network-upgrades/mainnet-upgrades"
					target="_blank"
					rel="noopener noreferrer"
					data-tag
				>
					execution-specs
				</a>
				<a
					href="https://forkcast.org"
					target="_blank"
					rel="noopener noreferrer"
					data-tag
				>
					Forkcast
				</a>
			</nav>
		</header>

		<ul data-column="gap-4" role="list">
			{#each mainnetForksWithUpgrades as fork (fork.name.toLowerCase().replace(/\s+/g, '-'))}
				<li>
					<EntityView
						entityType={EntityType.NetworkFork}
						entity={fork}
						idSerialized={fork.name.toLowerCase().replace(/\s+/g, '-')}
						href={resolve(`/proposals/forks#NetworkFork:${fork.name.toLowerCase().replace(/\s+/g, '-')}`)}
						label={fork.name}
						layout={EntityLayout.PageSection}
						metadata={((a: string | null) =>
							a ? [{ term: 'Activation', detail: a }] : []
						)(formatActivation(fork))}
						data-scroll-item="snap-block-start"
					>
						{#if forkLinkEntries(fork).length > 0}
							<nav data-row="wrap" aria-label="Specs and docs">
								{#each forkLinkEntries(fork) as { label, href }}
									<a
										href={href}
										target="_blank"
										rel="noopener noreferrer"
										data-tag
									>
										{label}
									</a>
								{/each}
							</nav>
						{/if}
						{#if (fork.eipNumbers?.length ?? 0) > 0}
							<section data-column>
								<h3 class="sr-only">Included EIPs</h3>
								<ul data-row="wrap" role="list">
									{#each (fork.eipNumbers ?? []) as num (num)}
										{@const proposalEntry = entriesByNumber.get(num)}
										<li>
											<a
												href={proposalEntry ? getProposalPath(ProposalRealm.Ethereum, proposalEntry) : resolve(`/proposals/${ProposalRealm.Ethereum}/eip-${num}`)}
												data-tag="eip"
												title={proposalEntry ? proposalEntry.title : undefined}
											>
												EIP-{num}
												{#if proposalEntry}
													— {proposalEntry.title}
												{/if}
											</a>
										</li>
									{/each}
								</ul>
							</section>
						{:else}
							<p data-text="muted">No EIPs listed for this fork.</p>
						{/if}
					</EntityView>
				</li>
			{/each}
		</ul>
	</HeadingLevelProvider>
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
