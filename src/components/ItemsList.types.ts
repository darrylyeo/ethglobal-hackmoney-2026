import type { Snippet } from 'svelte'

export type ItemsListPagination = {
	hasMore: boolean
	onLoadMore: () => void
	loading?: boolean
	label?: string
	Placeholder?: Snippet<[{ loading: boolean }]>
}
