<script module lang="ts">
	export enum EntityLayout {
		Page = 'Page',
		PageSection = 'PageSection',
	}
</script>

<script lang="ts"
	generics="_EntityType extends EntityType, _Entity extends Entity<_EntityType> = Entity<_EntityType>"
>
	// Types/constants
	import type { Entity, EntityId, EntityType } from '$/data/$EntityType.ts'
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
		Title?: import('svelte').Snippet
		AfterTitle?: import('svelte').Snippet<[{ entity: _Entity | undefined; entityType: _EntityType }]>
		BeforeAnnotation?: import('svelte').Snippet<[{ entity: _Entity | undefined; entityType: _EntityType }]>
		children?: import('svelte').Snippet
		[key: string]: unknown
	} = $props()


	// (Derived)
	const articleId = $derived(`${entityType}:${idSerialized}`)
	const entityId = $derived(
		entityIdProp
			?? (entity as { $id?: EntityId } | undefined)?.$id
			?? (idSerialized != null &&
				[
					EntityTypeEnum.Session,
					EntityTypeEnum.Room,
					EntityTypeEnum.AgentChatTree,
				].includes(entityType)
				? ({ id: idSerialized } as EntityId)
				: undefined),
	)


	// Components
	import Heading from '$/components/Heading.svelte'
	import HeadingLevelProvider from '$/components/HeadingLevelProvider.svelte'
	import WatchButton from '$/components/WatchButton.svelte'
</script>


<article
	id={articleId}
	{...rest}
>
	<HeadingLevelProvider>
		<details
			open
			data-card
		>
			<summary>
				<header data-row="wrap gap-4">
					<div data-row="start gap-2">
						<div data-row-item="flexible" data-column="gap-2">
							<div data-row="start gap-2">
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

								{#if entityId != null}
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
											<dt>{term}</dt>
											<dd>{detail}</dd>
										</div>
									{/each}
								</dl>
							{/if}
						</div>
					</div>

					<div data-row="gap-2">
						{#if BeforeAnnotation}
							{@render BeforeAnnotation({ entity, entityType })}
						{/if}
						<span data-text="annotation">{annotation ??
							(entityTypes.find((e) => e.type === entityType)?.label ?? entityType)}</span>
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
