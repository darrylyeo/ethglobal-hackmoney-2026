import type { Snippet } from 'svelte'

export type ListPagination = {
	hasMore: boolean
	onLoadMore: () => void
	loading?: boolean
	label?: string
	Placeholder?: Snippet<[{ loading: boolean }]>
}
