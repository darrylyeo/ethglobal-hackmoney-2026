/**
 * Fetch EIP/ERC metadata from ethereum/EIPs and ethereum/ercs GitHub repos.
 * Data from raw markdown frontmatter only; no scraping of eips.ethereum.org.
 * https://github.com/ethereum/EIPs, https://github.com/ethereum/ercs, https://eips.ethereum.org/
 */

import { DataSource } from '$/constants/data-sources.ts'
import { ProposalType, type ProposalEntry } from '$/data/ProposalEntry.ts'

const EIPS_API = 'https://api.github.com/repos/ethereum/EIPs/contents/EIPS?ref=master'
const ERCS_API = 'https://api.github.com/repos/ethereum/ercs/contents/ERCS?ref=master'
const EIPS_RAW = 'https://raw.githubusercontent.com/ethereum/EIPs/master/EIPS'
const ERCS_RAW = 'https://raw.githubusercontent.com/ethereum/ercs/master/ERCS'
const OFFICIAL_BASE = 'https://eips.ethereum.org/EIPS/eip-'

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
	const m = name.match(/^(?:eip|erc)-(\d+)\.md$/)
	return m ? parseInt(m[1], 10) : null
}

const fetchFileList = async (url: string): Promise<GhFile[]> => {
	const res = await fetch(url)
	if (!res.ok) return []
	const data = await res.json()
	if (!Array.isArray(data)) return []
	return data.filter((f: GhFile) => f.type === 'file' && f.name.endsWith('.md'))
}

const fetchFrontmatter = async (url: string): Promise<Record<string, string>> => {
	const res = await fetch(url)
	if (!res.ok) return {}
	const text = await res.text()
	return parseFrontmatter(text)
}

const BATCH_SIZE = 8
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

const isErcType = (t: string) => /^erc$/i.test(t) || /erc/i.test(t)

const fetchEntriesFromRepo = async (
	apiUrl: string,
	rawBase: string,
	repoKind: 'eip' | 'erc',
): Promise<ProposalEntry[]> => {
	const files = await fetchFileList(apiUrl)
	const entries: ProposalEntry[] = []
	for (let i = 0; i < files.length; i += BATCH_SIZE) {
		const batch = files.slice(i, i + BATCH_SIZE)
		const results = await Promise.all(
			batch.map(async (f) => {
				const num = extractNumber(f.name)
				if (num == null) return null
				const url = f.download_url ?? `${rawBase}/${f.name}`
				const fm = await fetchFrontmatter(url)
				const eipNum = fm.eip ? parseInt(fm.eip, 10) : num
				const title = fm.title ?? f.name.replace(/\.md$/, '')
				const status = fm.status ?? 'Draft'
				const category =
					fm.category ?? fm.type ?? (repoKind === 'erc' ? 'ERC' : 'Unknown')
				const type: ProposalType =
					repoKind === 'erc' ||
					(fm.type && isErcType(fm.type)) ||
					(fm.category && isErcType(fm.category))
						? ProposalType.Erc
						: ProposalType.Eip
				return {
					$id: { id: String(eipNum) },
					number: eipNum,
					title,
					status,
					category,
					url: `${OFFICIAL_BASE}${eipNum}`,
					type,
					$source: DataSource.Eips,
				} satisfies ProposalEntry
			}),
		)
		for (const e of results) if (e) entries.push(e)
		if (i + BATCH_SIZE < files.length) await delay(100)
	}
	return entries
}

export const fetchProposalEntries = async (): Promise<ProposalEntry[]> => {
	const [eips, ercs] = await Promise.all([
		fetchEntriesFromRepo(EIPS_API, EIPS_RAW, 'eip'),
		fetchEntriesFromRepo(ERCS_API, ERCS_RAW, 'erc'),
	])
	const byNumber = new Map<number, ProposalEntry>()
	for (const e of eips) byNumber.set(e.number, e)
	for (const e of ercs) {
		if (!byNumber.has(e.number)) byNumber.set(e.number, e)
	}
	return [...byNumber.values()].sort((a, b) => a.number - b.number)
}
