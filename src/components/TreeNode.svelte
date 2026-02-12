<script
	lang="ts"
	generics="
		_Node,
		_Key extends string | number = string | number
	"
>
	// Types/constants
	import type { Snippet } from 'svelte'
	import type { SvelteHTMLElements } from 'svelte/elements'


	// Props
	type ListTag = keyof Pick<SvelteHTMLElements, 'ul' | 'ol' | 'menu'>

	let {
		nodes,
		getKey,
		getChildren,
		isOpen,
		onOpenChange,
		Content,
		listTag = 'ul' as ListTag,
		listAttrs,
		detailsAttrs,
		summaryAttrs,
	}: {
		nodes: _Node[]
		getKey: (node: _Node) => _Key
		getChildren: (node: _Node) => _Node[] | undefined
		isOpen: (node: _Node) => boolean
		onOpenChange?: (node: _Node, open: boolean) => void
		Content: Snippet<[{ node: _Node }]>
		listTag?: ListTag
		listAttrs?: Partial<SvelteHTMLElements[ListTag]>
		detailsAttrs?: Partial<SvelteHTMLElements['details']>
		summaryAttrs?: Partial<SvelteHTMLElements['summary']>
	} = $props()


	// Components
	import TreeNode from '$/components/TreeNode.svelte'
</script>


	<svelte:element this={listTag} {...listAttrs}>
		{#each nodes as node (getKey(node))}
			{@const childNodes = getChildren(node)}
			<li>
				{#if childNodes?.length}
					<details
						{...detailsAttrs}
						open={isOpen(node)}
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
