<script lang="ts">
	// Types/constants
	import type { ForkUpgrade } from '$/constants/fork-upgrades.ts'
	import type { ForkActivation } from '$/data/fork-schedules/types.ts'
	import type { Entity } from '$/data/$EntityType.ts'
	import type { ProposalEntry } from '$/data/ProposalEntry.ts'
	import { EntityType } from '$/data/$EntityType.ts'
	import { EntityLayout } from '$/components/EntityView.svelte'
	import { networksCollection } from '$/collections/Networks.ts'
	import { proposalsCollection } from '$/collections/Proposals.ts'
	import { FORK_UPGRADES } from '$/constants/fork-upgrades.ts'
	import { ChainId, networksByChainId } from '$/constants/networks.ts'
	import { FORK_SCHEDULE_BY_CHAIN_ID } from '$/constants/fork-schedules.ts'
	import { getProposalPath, ProposalRealm } from '$/lib/proposal-paths.ts'
	import { parseNetworkNameParam } from '$/lib/patterns.ts'
	import { eq, useLiveQuery } from '@tanstack/svelte-db'


	// Context
	import { page } from '$app/state'
	import { resolve } from '$app/paths'


	// (Derived)
	const chainIdParam = $derived((page.params as { chainId?: string }).chainId ?? '')
	const route = $derived(parseNetworkNameParam(chainIdParam))
	const chainId = $derived(route?.chainId ?? 0)
	const network = $derived(route?.network)
	const slug = $derived(route?.slug ?? '')
	const caip2 = $derived(route?.caip2 ?? '')
	const isMainnet = $derived(chainId === ChainId.Ethereum)
	const scheduleForks = $derived(FORK_SCHEDULE_BY_CHAIN_ID[chainId]?.forks ?? null)
	const showForkList = $derived(
		isMainnet || (scheduleForks != null && scheduleForks.length > 0),
	)

	const networkQuery = useLiveQuery(
		(q) =>
			q
				.from({ row: networksCollection })
				.where(({ row }) => eq(row.$id.chainId, chainId))
				.select(({ row }) => ({ row })),
		[() => chainId],
	)
	const proposalsQuery = useLiveQuery((q) =>
		q
			.from({ row: proposalsCollection })
			.select(({ row }) => ({ row })),
	)

	const networkEntity = $derived(
		network && route
			? (networkQuery.data?.[0]?.row
				? ({
					...networkQuery.data[0].row,
					network: route.network,
					slug: route.slug,
					caip2: route.caip2,
				} as Entity<EntityType.Network> & {
					network: typeof route.network
					slug: string
					caip2: string
				})
				: { ...network, $id: { chainId: network.chainId } })
			: undefined,
	)

	const entriesByNumber = $derived(
		new Map<number, ProposalEntry>(
			(proposalsQuery.data ?? []).map((r) => {
				const row = r.row as ProposalEntry
				return [row.number, row]
			}),
		),
	)

	const forksSet = $derived(new Set(FORK_UPGRADES))

	const mainnetForksHref = $derived(
		resolve(
			`/network/${networksByChainId[ChainId.Ethereum]?.slug ?? ChainId.Ethereum}/forks`,
		),
	)


	// Functions
	const formatActivation = (f: ForkUpgrade) =>
		f.activationBlock != null
			? `Block ${f.activationBlock.toLocaleString()}`
			: f.activationTimestamp != null
				? new Date(f.activationTimestamp * 1000).toISOString().slice(0, 10)
				: null

	const forkLinkEntries = (f: ForkUpgrade) =>
		[
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

	const formatActivationSchedule = (f: ForkActivation) => {
		const a = f.activation
		if (a.block != null) return `Block ${a.block.toLocaleString()}`
		if (a.timestamp != null) return new Date(a.timestamp * 1000).toISOString().slice(0, 10)
		if (a.epoch != null) return `Epoch ${a.epoch.toLocaleString()}`
		return null
	}

	const forkSlug = (f: ForkActivation) =>
		f.name.toLowerCase().replace(/\s+/g, '-')

	// Components
	import EntityList from '$/components/EntityList.svelte'
	import EntityView from '$/components/EntityView.svelte'
	import Heading from '$/components/Heading.svelte'
	import NetworkContracts from '$/views/network/NetworkContracts.svelte'
	import NetworkName from '$/views/NetworkName.svelte'
</script>

<svelte:head>
	<title>Fork upgrades · {network?.name ?? 'Network'}</title>
</svelte:head>

<main data-column="gap-2">
	{#if !route}
		<Heading>Network not found</Heading>
		<p>The network "{chainIdParam}" could not be resolved.</p>
	{:else if !showForkList}
		<header data-column="gap-2">
			<Heading>Fork upgrades</Heading>
			<p data-text="annotation">
				Fork schedule is not available for this network.
				<a href={mainnetForksHref} data-link>View Ethereum mainnet fork upgrades</a>.
			</p>
		</header>
		<p>
			<a href={resolve(`/network/${chainIdParam}`)} data-link>Back to {network?.name ?? 'network'}</a>
		</p>
	{:else}
		<EntityView
			entityType={EntityType.Network}
			entity={networkEntity}
			idSerialized={slug}
			href={resolve(`/network/${chainIdParam}`)}
			label={network?.name ?? ''}
			metadata={[
				{ term: 'Chain ID', detail: String(chainId) },
				{ term: 'CAIP-2', detail: caip2 },
				...(
					network && 'nativeCurrency' in network && network.nativeCurrency
						? [{ term: 'Currency', detail: network.nativeCurrency.symbol }]
						: []
				),
			]}
		>
			{#snippet Title()}
				<NetworkName {chainId} />
			{/snippet}
			{#snippet AfterTitle({ entity })}
				{#if entity && 'network' in entity && entity.network?.type}
					<span data-tag={entity.network.type}>{entity.network.type}</span>
				{/if}
			{/snippet}
			{#snippet children()}
				<p>
					<a href={resolve(`/network/${chainIdParam}/contracts`)} data-link>Contracts</a>
					<a href={resolve('/proposals')} data-link>Proposals (EIPs / ERCs)</a>
				</p>
				<NetworkContracts chainId={chainId} nameParam={chainIdParam} />
				<nav data-row="gap-2 wrap" aria-label="External resources">
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
				{#if isMainnet}
					<EntityList
						title="Fork upgrades"
						loaded={forksSet.size}
						items={forksSet}
						getKey={(f) => f.slug}
						getSortValue={(f) => -(f.activationBlock ?? f.activationTimestamp ?? 0)}
						placeholderKeys={new Set()}
						detailsProps={{ open: true, 'data-card': 'radius-2 padding-4' }}
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
										idSerialized={item.slug}
										href={resolve(`/network/${chainIdParam}/forks#NetworkFork:${item.slug}`)}
										label={item.name}
										layout={EntityLayout.PageSection}
										metadata={((a: string | null) =>
											a ? [{ term: 'Activation', detail: a }] : []
										)(formatActivation(item))}
										data-scroll-item="snap-block-start"
									>
										{#if forkLinkEntries(item).length > 0}
											<nav data-row="gap-2 wrap" aria-label="Specs and docs">
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
										{#if item.eipNumbers.length > 0}
											<section data-column="gap-2">
												<h3 class="sr-only">Included EIPs</h3>
												<ul data-row="gap-2 wrap" role="list">
													{#each item.eipNumbers as num (num)}
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
					</EntityList>
				{:else}
					{@const forks = scheduleForks ?? []}
					<EntityList
						title="Fork upgrades"
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
						detailsProps={{ open: true, 'data-card': 'radius-2 padding-4' }}
						scrollPosition="Start"
					>
						{#snippet Item({ key, item, isPlaceholder })}
							<span id="NetworkFork:{key}">
								{#if isPlaceholder}
									<code>{key} (loading…)</code>
								{:else if item}
									<EntityView
										entityType={EntityType.NetworkFork}
										entity={{
											name: item.name,
											slug: key,
											links: {},
											eipNumbers: [],
										}}
										idSerialized={key}
										href={resolve(`/network/${chainIdParam}/forks#NetworkFork:${key}`)}
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
					</EntityList>
				{/if}
			{/snippet}
		</EntityView>
	{/if}
</main>
