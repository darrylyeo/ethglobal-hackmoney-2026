/**
 * Normalization for markdown frontmatter and body. All proposal/CAIP data
 * normalization from raw GitHub content happens here and in callers in this api layer.
 */

const FRONTMATTER_RE = /^---\s*\n[\s\S]*?\n---\s*\n?/

export const parseFrontmatter = (text: string): Record<string, string> => {
	const match = text.match(/^---\s*\n([\s\S]*?)\n---/)
	if (!match) return {}
	const block = match[1]
	const out: Record<string, string> = {}
	for (const line of block.split('\n')) {
		const colon = line.indexOf(':')
		if (colon < 0) continue
		const key = line.slice(0, colon).trim().toLowerCase()
		const val = line.slice(colon + 1).trim().replace(/^['"]|['"]$/g, '')
		if (key && val) out[key] = val
	}
	return out
}

export const stripFrontmatter = (text: string) =>
	text.replace(FRONTMATTER_RE, '').trim()

/** Normalize created date: first value if comma-separated, trimmed, undefined if empty. */
export const normalizeCreated = (raw: string | undefined): string | undefined => {
	const s = raw?.trim()
	if (!s) return undefined
	return s.includes(',') ? s.split(',')[0].trim() : s
}
