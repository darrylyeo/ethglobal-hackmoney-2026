export type Match = {
	start: number
	end: number
}

/**
 * Fuzzy subsequence match: query characters must appear in order in text (case-insensitive).
 * Returns non-overlapping spans for the matched segments.
 */
export function fuzzyMatch(text: string, query: string) {
	const q = query.trim().toLowerCase()
	if (!q) return []
	const lower = text.toLowerCase()
	const spans: Match[] = []
	let ti = 0
	for (let qi = 0; qi < q.length; qi++) {
		const pos = lower.indexOf(q[qi], ti)
		if (pos === -1) return spans
		const last = spans[spans.length - 1]
		if (last && pos === last.end) last.end = pos + 1
		else spans.push({ start: pos, end: pos + 1 })
		ti = pos + 1
	}
	return spans
}
