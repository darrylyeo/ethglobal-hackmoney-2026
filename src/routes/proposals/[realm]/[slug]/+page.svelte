<script lang="ts">
	// Types/constants
	import type { CaipEntry } from '$/data/CaipEntry.ts'
	import type { ProposalEntry } from '$/data/ProposalEntry.ts'
	import { caipsCollection } from '$/collections/Caips.ts'
	import { proposalsCollection } from '$/collections/Proposals.ts'
	import { EntityType } from '$/data/$EntityType.ts'
	import { ProposalType } from '$/data/ProposalEntry.ts'
	import {
		getProposalPath,
		parseProposalRealmParam,
		parseProposalSlug,
		proposalSlug,
		ProposalRealm,
	} from '$/lib/proposal-paths.ts'
	import { useLiveQuery } from '@tanstack/svelte-db'

	// Context
	import { page } from '$app/state'
	import { resolve } from '$app/paths'

	// (Derived)
	const realmParam = $derived(page.params?.realm ?? '')
	const slugParam = $derived(page.params?.slug ?? '')
	const realm = $derived(parseProposalRealmParam(realmParam))
	const parsed = $derived(parseProposalSlug(slugParam))
	const isValidRealm = $derived(realm != null)

	const proposalsQuery = useLiveQuery((q) =>
		q
			.from({ row: proposalsCollection })
			.select(({ row }) => ({ row })),
	)
	const caipsQuery = useLiveQuery((q) =>
		q
			.from({ row: caipsCollection })
			.select(({ row }) => ({ row })),
	)

	const proposalEntry = $derived(
		parsed && realm === ProposalRealm.Ethereum && parsed.kind !== 'caip'
			? (proposalsQuery.data ?? []).find(
				(r) => (r.row as ProposalEntry).number === parsed.number,
			)?.row as ProposalEntry | undefined
			: undefined,
	)
	const caipEntry = $derived(
		parsed && realm === ProposalRealm.ChainAgnostic && parsed.kind === 'caip'
			? (caipsQuery.data ?? []).find(
				(r) => (r.row as CaipEntry).number === parsed.number,
			)?.row as CaipEntry | undefined
			: undefined,
	)

	const entry = $derived(proposalEntry ?? caipEntry)
	const canonicalSlug = $derived(entry ? proposalSlug(entry) : null)
	const shouldRedirect = $derived(
		entry != null && canonicalSlug != null && slugParam !== canonicalSlug,
	)

	const idSerialized = $derived(String(entry?.number ?? parsed?.number ?? ''))
	const label = $derived(
		entry
			? 'type' in entry && entry.type !== undefined
				? `${entry.type === ProposalType.Erc ? 'ERC' : 'EIP'}-${entry.number} ${entry.title}`
				: `CAIP-${entry.number} ${entry.title}`
			: idSerialized,
	)
	const metadata = $derived(
		entry
			? 'category' in entry
				? [
						{ term: 'Status', detail: entry.status },
						{ term: 'Category', detail: (entry as ProposalEntry).category },
						{
							term: 'Type',
							detail: (entry as ProposalEntry).type === ProposalType.Erc ? 'ERC' : 'EIP',
						},
					]
				: [
						{ term: 'Status', detail: (entry as CaipEntry).status },
						{ term: 'Type', detail: (entry as CaipEntry).type },
					]
			: [],
	) as { term: string; detail: string }[]

	const isLoading = $derived(
		(realm === ProposalRealm.Ethereum && proposalsQuery.isLoading) ||
		(realm === ProposalRealm.ChainAgnostic && caipsQuery.isLoading),
	)
	const lastError = $derived(
		realm === ProposalRealm.Ethereum
			? (proposalsCollection.utils.lastError as unknown as { message?: string })?.message
			: (caipsCollection.utils.lastError as unknown as { message?: string })?.message,
	)

	// Components
	import { goto } from '$app/navigation'
	import EntityView from '$/components/EntityView.svelte'
	import Caip from '$/views/Caip.svelte'
	import Proposal from '$/views/Proposal.svelte'

	$effect(() => {
		if (!shouldRedirect || !entry || !canonicalSlug) return
		goto(getProposalPath(realm!, entry), { replaceState: true })
	})
</script>

<svelte:head>
	<title>
		{proposalEntry
			? `${proposalEntry.type === ProposalType.Erc ? 'ERC' : 'EIP'}-${proposalEntry.number}: ${proposalEntry.title}`
			: caipEntry
				? `CAIP-${caipEntry.number}: ${caipEntry.title}`
				: parsed
					? parsed.kind === 'caip'
						? `CAIP ${parsed.number}`
						: `EIP/ERC ${parsed.number}`
					: 'Proposal'}
		– Proposals
	</title>
</svelte:head>

<main>
	{#if !isValidRealm || !parsed}
		<h1>Not found</h1>
		<p>
			Invalid proposal path: {realmParam || '(realm)'}/{slugParam || '(slug)'}. Use
			<code>ethereum</code> or <code>chain-agnostic</code> and a slug like <code>eip-155</code>,
			<code>erc-20</code>, or <code>caip-1</code>.
		</p>
		<p>
			<a href={resolve('/proposals')}>Browse proposals</a>
		</p>
	{:else if isLoading && !entry}
		<p>Loading…</p>
	{:else if (realm === ProposalRealm.Ethereum ? proposalsQuery.isError : caipsQuery.isError) && !entry}
		<p>
			Failed to load:
			{lastError ?? 'Unknown error'}
		</p>
	{:else if !entry}
		<h1>Not found</h1>
		<p>
			{parsed.kind === 'caip'
				? `CAIP-${parsed.number}`
				: parsed.kind === ProposalType.Erc
					? 'ERC'
					: 'EIP'}-{parsed.number} not in index.
		</p>
		<p>
			<a href={resolve('/proposals')}>Browse proposals</a>
		</p>
	{:else if proposalEntry}
		<section data-scroll-item>
			<EntityView
				entityType={EntityType.Proposal}
				entity={proposalEntry}
				titleHref={getProposalPath(ProposalRealm.Ethereum, proposalEntry)}
				open={false}
				{label}
				{metadata}
				annotation={proposalEntry.type === ProposalType.Erc ? 'ERC' : 'EIP'}
				sources={[proposalEntry.$source]}
				sourceLinks={[{ label: 'Official EIP', href: proposalEntry.url }]}
			>
				{#snippet Title()}
					<strong>{proposalEntry.type === ProposalType.Erc ? 'ERC' : 'EIP'}-{proposalEntry.number}</strong>
					{proposalEntry.title}
				{/snippet}
				<Proposal entry={proposalEntry} />
			</EntityView>
		</section>
	{:else if caipEntry}
		<section data-scroll-item>
			<EntityView
				entityType={EntityType.Caip}
				entity={caipEntry}
				titleHref={getProposalPath(ProposalRealm.ChainAgnostic, caipEntry)}
				open={false}
				{label}
				{metadata}
				annotation="CAIP"
				sources={[caipEntry.$source]}
				sourceLinks={[{ label: 'Official CAIP', href: caipEntry.url }]}
			>
				{#snippet Title()}
					<strong>CAIP-{caipEntry.number}</strong>
					{caipEntry.title}
				{/snippet}
				<Caip entry={caipEntry} />
			</EntityView>
		</section>
	{/if}
</main>
