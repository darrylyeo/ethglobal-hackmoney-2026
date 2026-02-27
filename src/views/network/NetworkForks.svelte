<script lang="ts">
	// Types/constants
	import type { Fork } from '$/constants/forks/types.ts'
	import type { ProposalEntry } from '$/data/ProposalEntry.ts'
	import { EntityType } from '$/data/$EntityType.ts'
import { entityKey } from '$/lib/entity-key.ts'
	import { EntityLayout } from '$/components/EntityView.svelte'
	import { proposalsCollection } from '$/collections/Proposals.ts'
	import { forksByChainId } from '$/constants/forks/index.ts'
	import {
		dateFromUnixSeconds,
		mainnetForksWithUpgrades,
	} from '$/lib/forks.ts'
	import type { Network$Id } from '$/data/Network.ts'
	import { ChainId } from '$/constants/networks.ts'
	import { getForksPagePath } from '$/lib/network-paths.ts'
	import { getProposalPath, ProposalRealm } from '$/lib/proposal-paths.ts'
	import { useLiveQuery } from '@tanstack/svelte-db'


	// Context
	import { resolve } from '$app/paths'


	// Props
	let {
		networkId,
		detailsProps = {},
	}: {
		networkId: Network$Id
		detailsProps?: Record<string, unknown>
	} = $props()


	// (Derived)
	const chainId = $derived(Number(networkId.chainId))
	const scheduleForks = $derived(forksByChainId[chainId] ?? null)
	const forksBase = $derived(resolve(getForksPagePath(chainId)))
	const forksToShow = $derived(
		chainId === ChainId.Ethereum
			? mainnetForksWithUpgrades
			: (scheduleForks ?? []),
	)

	const proposalsQuery = useLiveQuery((q) =>
		q
			.from({ row: proposalsCollection })
			.select(({ row }) => ({ row })),
	)
	const entriesByNumber = $derived(
		new Map<number, ProposalEntry>(
			(proposalsQuery.data ?? []).map((r) => {
				const proposal = r.row as ProposalEntry
				return [proposal.number, proposal]
			}),
		),
	)


	// Functions
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

	const formatActivationSchedule = (f: Fork) => {
		const a = f.activation
		if (a.block != null) return `Block ${a.block.toLocaleString()}`
		if (a.timestamp != null)
			return dateFromUnixSeconds(a.timestamp)?.toISOString().slice(0, 10) ?? null
		if (a.epoch != null) return `Epoch ${a.epoch.toLocaleString()}`
		return null
	}

	const forkSlug = (f: Fork) =>
		f.name.toLowerCase().replace(/\s+/g, '-')


	// Components
	import EntityView from '$/components/EntityView.svelte'
	import CollapsibleList from '$/components/CollapsibleList.svelte'
</script>


<CollapsibleList
	title="Forks"
	loaded={forksToShow.length}
	items={new Set(forksToShow)}
	getKey={(f) => forkSlug(f)}
	getSortValue={(f) => -(
		f.activation.block ??
		f.activation.timestamp ??
		f.activation.epoch ??
		0
	)}
	placeholderKeys={new Set()}
	detailsProps={{ open: true, ...detailsProps }}
	scrollPosition="Start"
>
	{#snippet Empty()}
		<p data-text="muted">No forks.</p>
	{/snippet}
	{#snippet Item({ key, item, isPlaceholder })}
		<span>
			{#if isPlaceholder}
				<code>{key} (loading…)</code>
			{:else if item}
				{@const activation = formatActivationSchedule(item)}
				<EntityView
					entityType={EntityType.NetworkFork}
					entity={item}
					titleHref={`${forksBase}#${entityKey(EntityType.NetworkFork, item)}`}
					label={item.name}
					layout={EntityLayout.PageSection}
					metadata={activation ? [{ term: 'Activation', detail: activation }] : []}
					data-scroll-item="snap-block-start"
				>
					{#if forkLinkEntries(item).length > 0}
						<nav data-row="wrap" aria-label="Specs and docs">
							{#each forkLinkEntries(item) as { label, href }}
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
					{#if (item.eipNumbers?.length ?? 0) > 0}
						<section data-column>
							<h3 class="sr-only">Included EIPs</h3>
							<ul data-row="wrap" role="list">
								{#each (item.eipNumbers ?? []) as num (num)}
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
			{/if}
		</span>
	{/snippet}
</CollapsibleList>
