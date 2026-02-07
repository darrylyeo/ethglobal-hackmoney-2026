function hasWindow() {
	return typeof window !== 'undefined'
}

function getWindow(node: unknown): typeof window {
	const doc = (node as Node)?.ownerDocument
	return doc?.defaultView ?? globalThis.window
}

function isNode(value: unknown): value is Node {
	if (!hasWindow()) return false
	return value instanceof Node || value instanceof (getWindow(value)?.Node ?? Node)
}

export function observeMove(
	element: Element,
	isEnabled: () => boolean,
	onMove: () => void,
): () => void {
	let io: IntersectionObserver | null = null
	let timeoutId: ReturnType<typeof setTimeout> | undefined

	const root =
		(isNode(element)
			? (element as Element).ownerDocument
			: (element as { document?: Document }).document)?.documentElement ??
		globalThis.document?.documentElement

	function cleanup() {
		if (timeoutId !== undefined) clearTimeout(timeoutId)
		io?.disconnect()
		io = null
	}

	function refresh(skip = false, threshold = 1) {
		cleanup()

		const rect = element.getBoundingClientRect()
		const { left, top, width, height } = rect

		if (!skip) onMove()

		if (!width || !height || !root) return

		const insetTop = Math.floor(top)
		const insetRight = Math.floor(root.clientWidth - (left + width))
		const insetBottom = Math.floor(root.clientHeight - (top + height))
		const insetLeft = Math.floor(left)
		const rootMargin = `${-insetTop}px ${-insetRight}px ${-insetBottom}px ${-insetLeft}px`

		let isFirstUpdate = true

		function handleObserve(entries: IntersectionObserverEntry[]) {
			if (!isEnabled()) return
			const ratio = entries[0]?.intersectionRatio ?? 0
			if (ratio !== threshold) {
				if (!isFirstUpdate) refresh()
				else if (!ratio) {
					timeoutId = setTimeout(() => refresh(false, 1e-7), 1000)
				} else {
					refresh(false, ratio)
				}
			}
			isFirstUpdate = false
		}

		try {
			io = new IntersectionObserver(handleObserve, {
				rootMargin,
				threshold: Math.max(0, Math.min(1, threshold)) || 1,
				root: root.ownerDocument ?? undefined,
			})
		} catch {
			io = new IntersectionObserver(handleObserve, { rootMargin, threshold })
		}
		io.observe(element)
	}

	refresh(true)
	return cleanup
}
