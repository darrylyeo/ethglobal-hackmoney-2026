export function useVisibleAction(
	node: HTMLElement,
	onVisible: (() => void) | undefined,
): { update?: (onVisible: (() => void) | undefined) => void; destroy: () => void } {
	let callback = onVisible
	const observer = new IntersectionObserver(
		([entry]) => {
			if (entry.isIntersecting && typeof callback === 'function') callback()
		},
		{ rootMargin: '200px' },
	)
	observer.observe(node)
	return {
		update: (next: (() => void) | undefined) => {
			callback = next
		},
		destroy: () => observer.disconnect(),
	}
}
