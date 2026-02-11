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
	import type { Entity, EntityType } from '$/data/$EntityType.ts'
	import { entityTypes } from '$/data/$EntityType.ts'


	// Props
	let {
		entityType,
		entity,
		idSerialized,
		href,
		label,
		layout = EntityLayout.Page,
		metadata,
		annotation,
		autoWatched = false,
		anchorTitle = true,
		Title,
		AfterTitle,
		BeforeAnnotation,
		children,
		...rest
	}: {
		entityType: _EntityType
		entity?: _Entity
		idSerialized: string
		href: string
		label: string
		layout?: EntityLayout
		metadata?: Array<{ term: string; detail: string }>
		annotation?: string
		autoWatched?: boolean
		anchorTitle?: boolean
		Title?: import('svelte').Snippet
		AfterTitle?: import('svelte').Snippet<[{ entity: _Entity | undefined; entityType: _EntityType }]>
		BeforeAnnotation?: import('svelte').Snippet<[{ entity: _Entity | undefined; entityType: _EntityType }]>
		children?: import('svelte').Snippet
		[key: string]: unknown
	} = $props()


	// (Derived)
	const entityTypeLabel = $derived(
		annotation ??
			(entityTypes.find((e) => e.type === entityType)?.label ?? entityType),
	)
	const articleId = $derived(`${entityType}:${idSerialized}`)


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
								{#snippet headingContent()}
									<Heading>
										{#if Title}
											{@render Title()}
										{:else}
											{label}
										{/if}
									</Heading>
								{/snippet}

								{#if anchorTitle}
									<a href={`#${articleId}`}>
										{@render headingContent()}
									</a>
								{:else}
									{@render headingContent()}
								{/if}

								{#if AfterTitle}
									{@render AfterTitle({ entity, entityType })}
								{/if}

								<WatchButton
									{entityType}
									id={idSerialized}
									{label}
									{href}
									{autoWatched}
								/>
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
						<span data-text="annotation">{entityTypeLabel}</span>
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
