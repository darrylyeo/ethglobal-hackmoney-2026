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
	import type { Entity, EntityId, EntityType } from '$/data/$EntityType.ts'
	import type { Snippet } from 'svelte'
	import { EntityType as EntityTypeEnum, entityTypes } from '$/data/$EntityType.ts'


	// Props
	let {
		entityType,
		entity,
		entityId: entityIdProp,
		idSerialized,
		href,
		label,
		layout = EntityLayout.Page,
		metadata,
		annotation,
		hasAnchorTitle = true,
		showWatchButton = true,
		open = true,
		ontoggle,
		detailsProps = {},
		detailsRef = $bindable(null as HTMLDetailsElement | HTMLElement | null),
		Title,
		AfterTitle,
		BeforeAnnotation,
		children,
		...rest
	}: {
		entityType: _EntityType
		entity?: _Entity
		entityId?: EntityId
		idSerialized: string
		href: string
		label: string
		layout?: EntityLayout
		metadata?: Array<{ term: string; detail: string }>
		annotation?: string
		hasAnchorTitle?: boolean
		showWatchButton?: boolean
		open?: boolean
		ontoggle?: (e: Event) => void
		detailsProps?: Record<string, unknown>
		detailsRef?: HTMLDetailsElement | HTMLElement | null
		Title?: Snippet
		AfterTitle?: Snippet<[{ entity: _Entity | undefined; entityType: _EntityType }]>
		BeforeAnnotation?: Snippet<[{ entity: _Entity | undefined; entityType: _EntityType }]>
		children?: Snippet
		[key: string]: unknown
	} = $props()


	// (Derived)
	const articleId = $derived(`${entityType}:${idSerialized}`)
	const entityId = $derived(
		entityIdProp
		?? (entity as { $id?: EntityId } | undefined)?.$id
		?? (
			idSerialized != null
			&& [EntityTypeEnum.Session, EntityTypeEnum.Room, EntityTypeEnum.AgentChatTree].includes(entityType)
				? ({ id: idSerialized } as EntityId)
				: undefined
		),
	)


	// Components
	import Heading from '$/components/Heading.svelte'
	import HeadingLevelProvider from '$/components/HeadingLevelProvider.svelte'
	import WatchButton from '$/components/WatchButton.svelte'
</script>


{#if layout === EntityLayout.ContentOnly}
	<div
		data-column="gap-4"
		bind:this={detailsRef}
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
		<HeadingLevelProvider>
			<details
				bind:this={detailsRef}
				{open}
				data-card
				{...detailsProps}
				ontoggle={ontoggle}
			>
				<summary>
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

									{#if hasAnchorTitle}
										<a href={`#${articleId}`}>
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
											{entityId}
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
				</summary>

				{#if children}
					<div data-column="gap-4">
						{@render children()}
					</div>
				{/if}
			</details>
		</HeadingLevelProvider>
	</article>
{/if}
