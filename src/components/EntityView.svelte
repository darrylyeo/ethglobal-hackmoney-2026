<script module lang="ts">
	export enum EntityLayout {
		Page = 'Page',
		PageSection = 'PageSection',
		ContentOnly = 'ContentOnly',
	}
</script>


<script
	lang="ts"
	generics="
		_EntityType extends EntityType,
		_Entity extends Entity<_EntityType> = Entity<_EntityType>
	"
>
	// Types/constants
	import type { DataSourceId } from '$/constants/data-sources.ts'
	import type { Entity, EntityId, EntityType } from '$/data/$EntityType.ts'
	import type { Snippet } from 'svelte'
	import { stringify } from 'devalue'
	import { EntityType as EntityTypeEnum, entityTypes } from '$/data/$EntityType.ts'
	import { formatSourceList } from '$/lib/formatSourceList.ts'


	// Props
	let {
		entityType,
		entity,
		entityId: entityIdProp,
		idSerialized = '',
		/** Omit = fragment #articleId, string = that URL, false = no link. Only when no custom Title. */
		titleHref,
		label,
		layout = EntityLayout.Page,
		metadata,
		annotation,
		showWatchButton = true,
		open = true,
		ontoggle,
		detailsProps = {},
		Title,
		AfterTitle,
		BeforeAnnotation,
		children,
		sources = [],
		sourceLinks = [],
		...rest
	}: {
		entityType: _EntityType
		entity?: _Entity
		entityId?: EntityId
		idSerialized?: string
		label: string
		titleHref?: true | string | false
		layout?: EntityLayout
		metadata?: Array<{ term: string; detail: string }>
		annotation?: string
		showWatchButton?: boolean
		open?: boolean
		ontoggle?: (e: Event) => void
		detailsProps?: Record<string, unknown>
		Title?: Snippet
		AfterTitle?: Snippet<[{ entity: _Entity | undefined; entityType: _EntityType }]>
		BeforeAnnotation?: Snippet<[{ entity: _Entity | undefined; entityType: _EntityType }]>
		children?: Snippet
		sources?: DataSourceId[]
		sourceLinks?: Array<{ label: string; href: string }>
		[key: string]: unknown
	} = $props()

	// (Derived)
	const entityId = $derived(
		entityIdProp
			?? (entity as { $id?: EntityId } | undefined)?.$id
			?? (
				idSerialized !== ''
				&& [EntityTypeEnum.Session, EntityTypeEnum.Room, EntityTypeEnum.AgentChatTree].includes(entityType) ?
					({ id: idSerialized } as EntityId)
				:
					undefined
			)
	)
	const articleId = $derived(
		`${entityType}:${entityId != null ? stringify(entityId) : idSerialized}`
	)
	const showFooter = $derived(
		layout !== EntityLayout.ContentOnly &&
		((sources?.length ?? 0) > 0 || (sourceLinks?.length ?? 0) > 0)
	)
	const sourcesFormatted = $derived(
		formatSourceList(sources ?? [])
	)


	// Components
	import Collapsible from '$/components/Collapsible.svelte'
	import Heading from '$/components/Heading.svelte'
	import WatchButton from '$/components/WatchButton.svelte'
</script>


{#if layout === EntityLayout.ContentOnly}
	<div
		class="entity-content"
		data-column="gap-4"
		{...detailsProps}
	>
		{#if children}
			{@render children()}
		{/if}
	</div>
{:else}
	<article
		id={articleId}
		{...rest}
	>
		<Collapsible
			title={label}
			open={open}
			annotation={annotation ?? (entityTypes.find((e) => e.type === entityType)?.label ?? entityType)}
			detailsProps={{ 'data-card': '', ...detailsProps }}
			incrementHeadingLevel={layout !== EntityLayout.Page}
			{ontoggle}
		>
			{#snippet Summary({ title: _title, annotation: _annotation })}
				<header data-row="wrap gap-4">
					<div data-row="start">
						<div data-row-item="flexible" data-column>
							<div data-row="start">
								{#snippet HeadingContent()}
									<Heading>
										{#if Title}
											{@render Title()}
										{:else}
											{label}
										{/if}
									</Heading>
								{/snippet}

							{#if titleHref !== false && !Title}
									<a href={(
										titleHref === true || titleHref === undefined ?
											`#${articleId}`
										:
											titleHref
									)}>
										{@render HeadingContent()}
									</a>

									{:else}
									{@render HeadingContent()}
									{/if}

								{#if AfterTitle}
									{@render AfterTitle({ entity, entityType })}
								{/if}

								{#if showWatchButton && entityId != null}
									<WatchButton
										{entityType}
										entity={entity as { $id: EntityId } | undefined}
										{...(entity == null ? { entityId } : {})}
									/>
								{/if}
							</div>

							{#if metadata?.length}
								<dl data-definition-list="horizontal">
									{#each metadata as { term, detail }}
										<div>
											{#if term}
												<dt>{term}</dt>
											{/if}

											<dd>{detail}</dd>
										</div>
									{/each}
								</dl>
							{/if}
						</div>
					</div>

					<div data-row>
						{#if BeforeAnnotation}
							{@render BeforeAnnotation({ entity, entityType })}
						{/if}

						<span data-text="annotation">
							{annotation
								?? (entityTypes.find((e) => e.type === entityType)?.label ?? entityType)}
						</span>
					</div>
				</header>
			{/snippet}

			{#if children}
				<div
					class="entity-content"
					data-column="layout-flex"
				>
					{@render children()}
				</div>
			{/if}
		</Collapsible>

		{#if showFooter}
			<footer class="entity-footer" data-column="gap-2">
				{#if (sources?.length ?? 0) > 0}
					<p data-text="muted">
						Data from: {sourcesFormatted}
					</p>
				{/if}

				{#if (sourceLinks?.length ?? 0) > 0}
					<nav aria-label="Source links" data-row="wrap gap-2">
						{#each sourceLinks as link}
							<a
								href={link.href}
								target="_blank"
								rel="noopener noreferrer"
								data-link
							>
								{link.label}
							</a>
						{/each}
					</nav>
				{/if}
			</footer>
		{/if}
	</article>
{/if}


<style>
	:global(details > .entity-content) {
		padding-top: var(--card-padding, 1em);
		border-top: 1px solid var(--color-border);
	}

	.entity-content :global([data-definition-list='vertical']) {
		row-gap: 1em;
		column-gap: 1.5em;
	}

	.entity-content :global([data-definition-list='vertical'] dt) {
		min-width: 8em;
	}

	.entity-content :global([data-definition-list='vertical'] dd code) {
		word-break: break-all;
		font-size: 0.9em;
	}

	.entity-content :global([data-definition-list='vertical'] ul[role='list']) {
		list-style: none;
		padding-inline-start: 0;
		display: flex;
		flex-direction: column;
		gap: 0.35em;
	}

	.entity-footer {
		margin-top: 1em;
		padding-top: 1em;
		border-top: 1px solid var(--color-border);
	}
</style>
