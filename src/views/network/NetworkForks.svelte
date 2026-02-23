<script lang="ts">
	// Types/constants
	import type { Fork } from '$/constants/forks/index.ts'
	import type { ProposalEntry } from '$/data/ProposalEntry.ts'
	import { EntityType } from '$/data/$EntityType.ts'
	import { EntityLayout } from '$/components/EntityView.svelte'
	import { proposalsCollection } from '$/collections/Proposals.ts'
	import {
		dateFromUnixSeconds,
		forkByChainId,
		mainnetForksWithUpgrades,
	} from '$/constants/forks/index.ts'
	import type { Network$Id } from '$/data/Network.ts'
	import { ChainId } from '$/constants/networks.ts'
	import { getForksPagePath } from '$/lib/network-paths.ts'
	import { getProposalPath, ProposalRealm } from '$/lib/proposal-paths.ts'
	import { useLiveQuery } from '@tanstack/svelte-db'


	// Context
	import { resolve } from '$app/paths'


	// Props
	let {
		networkId: networkIdProp,
		chainId: chainIdProp,
		forksHref,
		detailsProps = {},
	}: {
		networkId?: Network$Id
		chainId?: number
		forksHref?: string
		detailsProps?: Record<string, unknown>
	} = $props()


	// (Derived)
	const chainId = $derived(networkIdProp?.chainId ?? chainIdProp ?? undefined)
	const scheduleForks = $derived(
		chainId != null ? forkByChainId[chainId]?.forks ?? null : null,
	)
	const showForkList = $derived(
		chainId === ChainId.Ethereum ||
			(scheduleForks != null && scheduleForks.length > 0),
	)
	const forksBase = $derived(
		chainId != null ? resolve(getForksPagePath(chainId)) : '',
	)
	const isMainnet = $derived(chainId === ChainId.Ethereum)
	const forksSet = $derived(new Set(mainnetForksWithUpgrades))

	const proposalsQuery = useLiveQuery((q) =>
		q
			.from({ row: proposalsCollection })
			.select(({ row }) => ({ row })),
	)
	const entriesByNumber = $derived(
		new Map<number, ProposalEntry>(
			(proposalsQuery.data ?? []).map((r) => {
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
	import ItemsListCollapsible from '$/components/ItemsListCollapsible.svelte'
	import Collapsible from '$/components/Collapsible.svelte'
</script>

{#if chainId != null && showForkList}
	{#if isMainnet}
		<ItemsListCollapsible
			title="Forks"
			loaded={forksSet.size}
			items={forksSet}
			getKey={(f) => f.name.toLowerCase().replace(/\s+/g, '-')}
			getSortValue={(f: Fork) => -(
				f.activation.block ??
				f.activation.timestamp ??
				f.activation.epoch ??
				0
			)}
			placeholderKeys={new Set()}
			detailsProps={{ open: true, ...detailsProps }}
			scrollPosition="Start"
		>
			{#snippet Item({ key, item, isPlaceholder })}
				<span id="NetworkFork:{key}">
					{#if isPlaceholder}
						<code>{key} (loading…)</code>
					{:else if item}
						<EntityView
							entityType={EntityType.NetworkFork}
							entity={item}
							idSerialized={item.name.toLowerCase().replace(/\s+/g, '-')}
							href={`${forksBase}#NetworkFork:${item.name.toLowerCase().replace(/\s+/g, '-')}`}
							label={item.name}
							layout={EntityLayout.PageSection}
							metadata={((a: string | null) =>
								a ? [{ term: 'Activation', detail: a }] : []
							)(formatActivation(item))}
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
		</ItemsListCollapsible>
	{:else}
		{@const forks = scheduleForks ?? []}
		<ItemsListCollapsible
			title="Forks"
			loaded={forks.length}
			items={new Set(forks)}
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
			{#snippet Item({ key, item, isPlaceholder })}
				<span id="NetworkFork:{key}">
					{#if isPlaceholder}
						<code>{key} (loading…)</code>
					{:else if item}
						<EntityView
							entityType={EntityType.NetworkFork}
							entity={item}
							idSerialized={key}
							href={`${forksBase}#NetworkFork:${key}`}
							label={item.name}
							layout={EntityLayout.PageSection}
							metadata={((a: string | null) =>
								a ? [{ term: 'Activation', detail: a }] : []
							)(formatActivationSchedule(item))}
							data-scroll-item="snap-block-start"
						/>
					{/if}
				</span>
			{/snippet}
		</ItemsListCollapsible>
	{/if}
{:else if forksHref}
	<Collapsible title="Forks" detailsProps={{ ...detailsProps, open: true }}>
		<p>
			<a href={forksHref} data-link>View fork schedule</a>
		</p>
	</Collapsible>
{/if}
