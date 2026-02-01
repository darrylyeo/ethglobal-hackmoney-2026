/**
 * Format elapsed milliseconds as human-readable relative time (e.g. "5m ago").
 */

export const formatRelativeTime = (msAgo: number): string => {
	if (msAgo < 0) return 'just now'
	const s = Math.floor(msAgo / 1000)
	const m = Math.floor(s / 60)
	const h = Math.floor(m / 60)
	const d = Math.floor(h / 24)
	if (s < 60) return 'just now'
	if (m < 60) return `${m}m ago`
	if (h < 24) return `${h}h ago`
	if (d < 7) return `${d}d ago`
	return `${Math.floor(d / 7)}w ago`
}
