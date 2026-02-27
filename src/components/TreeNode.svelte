<script module lang="ts">
	type ListTag = 'ul' | 'ol' | 'menu'
</script>


<script
	lang="ts"
	generics="
		_Node,
		_Key extends string | number = string | number,
		_ListTag extends ListTag = 'ul'
	"
>
	// Types/constants
	import type { Snippet } from 'svelte'
	import type { SvelteHTMLElements } from 'svelte/elements'

	type IsOpen = (node: _Node, isOpen: IsOpen) => boolean
	type IsHidden = (node: _Node, isHidden: IsHidden) => boolean


	// Props
	let {
		nodes,
		getKey,
		getChildren,
		isOpen,
		onOpenChange,
		isHidden,
		Content,
		listTag = 'ul' as _ListTag,
		listAttrs,
		detailsAttrs,
		summaryAttrs,
	}: {
		nodes: _Node[]
		getKey: (node: _Node) => _Key
		getChildren: (node: _Node) => _Node[] | undefined
		isOpen: IsOpen
		onOpenChange?: (node: _Node, isOpen: boolean) => void
		isHidden?: IsHidden
		Content: Snippet<[{ node: _Node }]>
		listTag?: _ListTag
		listAttrs?: Partial<SvelteHTMLElements[_ListTag]>
		detailsAttrs?: Partial<SvelteHTMLElements['details']>
		summaryAttrs?: Partial<SvelteHTMLElements['summary']>
	} = $props()


	// Components
	import TreeNode from '$/components/TreeNode.svelte'
</script>


<svelte:element
	this={listTag as ListTag}
	{...listAttrs}
>
	{#each nodes as node (getKey(node))}
		{@const childNodes = getChildren(node)}

		<li
			{...isHidden && isHidden(node, isHidden) && {
				hidden: true,
				inert: true,
			}}
		>
			{#if childNodes?.length}
				<details
					{...detailsAttrs}
					open={isOpen(node, isOpen)}
					ontoggle={(e: Event & { currentTarget: HTMLDetailsElement }) => {
						onOpenChange?.(node, e.currentTarget.open)
					}}
				>
					<summary {...summaryAttrs}>
						{@render Content({ node })}
					</summary>

					<TreeNode
						nodes={childNodes}
						{getKey}
						{getChildren}
						{isOpen}
						{onOpenChange}
						{isHidden}
						{Content}
						{listTag}
						{listAttrs}
						{detailsAttrs}
						{summaryAttrs}
					/>
				</details>
			{:else}
				{@render Content({ node })}
			{/if}
		</li>
	{/each}
</svelte:element>
