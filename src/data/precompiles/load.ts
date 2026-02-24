/**
 * Load precompiles from synced shemnon/precompiles JSON (src/data/precompiles/*.json).
 * Used by src/constants/precompiles/index.ts. Run deno task precompiles:sync to populate data.
 */

import type { PrecompileEntry } from '$/constants/precompiles/types.ts'

type ShemnonSchedule = Record<string, string[]>
type ShemnonPrecompile = {
	name: string
	address?: { full?: string; hex?: string }
}

const glob = import.meta.glob<{ default: ShemnonSchedule | ShemnonPrecompile }>(
	'/src/data/precompiles/*.json',
	{ eager: true },
)
const entries = Object.entries(glob).map(([path, mod]) => ({
	path,
	data: mod.default,
}))

const scheduleRe = /eip155-(\d+)-schedule\.json$/
const precompileRe = /eip155-(\d+)-0x([0-9a-fA-F]+)\.json$/

function parseAddress(raw: ShemnonPrecompile['address']): `0x${string}` {
	if (!raw) return '0x0000000000000000000000000000000000000000'
	const full = raw.full
	if (full && full.length === 66) return full as `0x${string}`
	const hex = (raw.hex ?? '').replace(/^0x/, '')
	return (`0x${hex.padStart(40, '0')}`) as `0x${string}`
}

const precompileDefs = new Map<string, PrecompileEntry>()
const chainIdsFromSchedules = new Set<number>()

for (const { path, data } of entries) {
	if (path.includes('manifest')) continue
	const scheduleMatch = path.match(scheduleRe)
	if (scheduleMatch) {
		chainIdsFromSchedules.add(Number(scheduleMatch[1]))
		continue
	}
	const precompileMatch = path.match(precompileRe)
	if (precompileMatch) {
		const id = path.slice(path.lastIndexOf('/') + 1).replace('.json', '')
		const d = data as ShemnonPrecompile
		precompileDefs.set(id, {
			address: parseAddress(d.address),
			name: d.name ?? id,
		})
	}
}

function precompileIdsFromSchedule(schedule: ShemnonSchedule): string[] {
	const ids = new Set<string>()
	for (const arr of Object.values(schedule)) {
		if (Array.isArray(arr)) for (const id of arr) ids.add(id)
	}
	return [...ids]
}

const precompilesByChainId = new Map<number, PrecompileEntry[]>()

for (const { path, data } of entries) {
	if (path.includes('manifest')) continue
	const scheduleMatch = path.match(scheduleRe)
	if (!scheduleMatch) continue
	const chainId = Number(scheduleMatch[1])
	const schedule = data as ShemnonSchedule
	const ids = precompileIdsFromSchedule(schedule)
	const list: PrecompileEntry[] = []
	const seen = new Set<string>()
	for (const id of ids) {
		let def = precompileDefs.get(id)
		if (!def && id.startsWith('eip155-4220-'))
			def = precompileDefs.get(id.replace('eip155-4220-', 'eip155-42220-'))
		if (!def) continue
		const key = def.address.toLowerCase()
		if (seen.has(key)) continue
		seen.add(key)
		list.push(def)
	}
	list.sort((a, b) => (BigInt(a.address) < BigInt(b.address) ? -1 : 1))
	precompilesByChainId.set(chainId, list)
}

/** Chain IDs that have a schedule in the synced shemnon data. */
export const syncedChainIds = new Set(chainIdsFromSchedules)

/** Precompiles per chain from shemnon data. Empty if sync never run. */
export const syncedPrecompilesByChainId = precompilesByChainId
