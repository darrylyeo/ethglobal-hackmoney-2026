/**
 * Fetch CAIP metadata from ChainAgnostic/CAIPs GitHub repo.
 * https://github.com/ChainAgnostic/CAIPs, https://chainagnostic.org/CAIPs/
 */

import { DataSource } from '$/constants/data-sources.ts'
import type { CaipEntry } from '$/data/CaipEntry.ts'

const CAIPS_API = 'https://api.github.com/repos/ChainAgnostic/CAIPs/contents/CAIPs?ref=main'
const CAIPS_RAW = 'https://raw.githubusercontent.com/ChainAgnostic/CAIPs/main/CAIPs'
const OFFICIAL_BASE = 'https://chainagnostic.org/CAIPs/caip-'

type GhFile = { name: string; download_url: string | null; type: string }

const parseFrontmatter = (text: string): Record<string, string> => {
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

const extractNumber = (name: string): number | null => {
	const m = name.match(/^caip-(\d+)\.md$/)
	return m ? parseInt(m[1], 10) : null
}

const fetchFileList = async (url: string): Promise<GhFile[]> => {
	const res = await fetch(url)
	if (!res.ok) return []
	const data = await res.json()
	if (!Array.isArray(data)) return []
	return data.filter((f: GhFile) => f.type === 'file' && f.name.endsWith('.md'))
}

const BATCH_SIZE = 8
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

export const fetchCaipEntries = async (): Promise<CaipEntry[]> => {
	const files = await fetchFileList(CAIPS_API)
	const entries: CaipEntry[] = []
	for (let i = 0; i < files.length; i += BATCH_SIZE) {
		const batch = files.slice(i, i + BATCH_SIZE)
		const results = await Promise.all(
			batch.map(async (f) => {
				const num = extractNumber(f.name)
				if (num == null) return null
				const url = f.download_url ?? `${CAIPS_RAW}/${f.name}`
				const res = await fetch(url)
				if (!res.ok) return null
				const text = await res.text()
				const fm = parseFrontmatter(text)
				const caipNum = fm.caip ? parseInt(fm.caip, 10) : num
				const title = fm.title ?? f.name.replace(/\.md$/, '')
				const status = fm.status ?? 'Draft'
				const type = fm.type ?? 'Informational'
				return {
					$id: { id: String(caipNum) },
					number: caipNum,
					title,
					status,
					type,
					url: `${OFFICIAL_BASE}${caipNum}`,
					$source: DataSource.Caips,
				} satisfies CaipEntry
			}),
		)
		for (const e of results) if (e) entries.push(e)
		if (i + BATCH_SIZE < files.length) await delay(100)
	}
	return entries.sort((a, b) => a.number - b.number)
}
