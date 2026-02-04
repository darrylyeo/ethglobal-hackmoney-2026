/**
 * Generic icon fetcher: chains, coins, providers. Writes to static/icons/{chains|coins|providers}/.
 * Run: deno run -A scripts/_fetch-icons.ts then deno task icons:optimize (svgo) for chains.
 */

import { unzipSync } from 'npm:fflate'
import {
	chainIconAliases,
	chainIconFetchItems,
} from '../src/constants/chain-icon-fetch-items.ts'
import {
	coinIconFetchItems,
	iconFilename,
	IconKind,
	isDefaultIcon,
	providerIconFetchItems,
	type IconFetchItem,
	type IconStyle,
} from '../src/constants/icons.ts'

const OUT_BASE = new URL('../static/icons/', import.meta.url)

function isSvgContent(text: string): boolean {
	const t = text.trim()
	return (
		t.startsWith('<?xml') ||
		t.startsWith('<svg') ||
		(t.startsWith('<!--') && t.includes('<svg'))
	)
}

async function fetchSvg(url: string): Promise<string> {
	const res = await fetch(url, {
		headers: { Accept: 'image/svg+xml' },
		redirect: 'follow',
	})
	if (!res.ok) throw new Error(`${url} ${res.status}`)
	const text = await res.text()
	if (!isSvgContent(text)) throw new Error(`${url} returned non-SVG content`)
	return text
}

function pngToSvgWrapper(pngBase64: string, size = 256): string {
	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}"><image width="${size}" height="${size}" href="data:image/png;base64,${pngBase64}"/></svg>`
}

const allItems: IconFetchItem[] = [
	...chainIconFetchItems,
	...coinIconFetchItems,
	...providerIconFetchItems,
]

async function main() {
	const writtenByTarget = {
		chain: new Set<string>(),
		coin: new Set<string>(),
		provider: new Set<string>(),
	}
	const defaultSvgByChainId = new Map<number, string>()
	const zipCache = new Map<string, Record<string, Uint8Array>>()

	const dirs = ['chains', 'coins', 'providers'] as const
	for (const d of dirs) {
		const dirUrl = new URL(d + '/', OUT_BASE)
		await Deno.mkdir(dirUrl, { recursive: true })
	}

	for (const item of allItems) {
		const { target, id, kind, style, fetch: f } = item
		const kindNorm = kind ?? IconKind.Logo
		const filename = iconFilename(id, kindNorm, style)
		const dirUrl = new URL(`${target}s/`, OUT_BASE)
		const path = new URL(filename, dirUrl)
		try {
			if (f.fetchType === 'zip') {
				let unzipped = zipCache.get(f.zipUrl)
				if (!unzipped) {
					const res = await fetch(f.zipUrl, { redirect: 'follow' })
					if (!res.ok) throw new Error(`${f.zipUrl} ${res.status}`)
					const buf = await res.arrayBuffer()
					unzipped = unzipSync(new Uint8Array(buf)) as Record<
						string,
						Uint8Array
					>
					zipCache.set(f.zipUrl, unzipped)
				}
				const entry = unzipped[f.pathInZip]
				if (!entry) throw new Error(`missing in zip: ${f.pathInZip}`)
				const svg = new TextDecoder().decode(entry)
				await Deno.writeTextFile(path, svg)
				writtenByTarget[target].add(filename)
				if (target === 'chain' && isDefaultIcon(kindNorm, style))
					defaultSvgByChainId.set(Number(id), svg)
				console.log(`OK ${target}s/${filename} (from ZIP)`)
			} else if (f.fetchType === 'png') {
				const res = await fetch(f.url, { redirect: 'follow' })
				if (!res.ok) throw new Error(`${f.url} ${res.status}`)
				const buf = await res.arrayBuffer()
				const b64 = btoa(String.fromCharCode(...new Uint8Array(buf)))
				const svg = pngToSvgWrapper(b64)
				await Deno.writeTextFile(path, svg)
				writtenByTarget[target].add(filename)
				if (target === 'chain' && isDefaultIcon(kindNorm, style))
					defaultSvgByChainId.set(Number(id), svg)
				console.log(`OK ${target}s/${filename} (PNG wrapped)`)
			} else {
				const svg = await fetchSvg(f.url)
				await Deno.writeTextFile(path, svg)
				writtenByTarget[target].add(filename)
				if (target === 'chain' && isDefaultIcon(kindNorm, style))
					defaultSvgByChainId.set(Number(id), svg)
				console.log(`OK ${target}s/${filename}`)
			}
		} catch (e) {
			console.warn(
				`SKIP ${target}s/${filename} (${f.fetchType}): ${e instanceof Error ? e.message : e}`,
			)
		}
	}

	for (const { fromId, toId } of chainIconAliases) {
		const tid = Number(fromId)
		const mid = Number(toId)
		const svg = defaultSvgByChainId.get(mid)
		if (!svg) continue
		try {
			const dest = new URL(`chains/${tid}.svg`, OUT_BASE)
			await Deno.writeTextFile(dest, svg)
			writtenByTarget.chain.add(`${tid}.svg`)
			console.log(`COPY chains/${tid}.svg <- ${mid}`)
		} catch {
			// ignore
		}
	}

	const total =
		writtenByTarget.chain.size +
		writtenByTarget.coin.size +
		writtenByTarget.provider.size
	console.log(
		`Done. ${total} files (chains: ${writtenByTarget.chain.size}, coins: ${writtenByTarget.coin.size}, providers: ${writtenByTarget.provider.size}). Run: deno task icons:optimize`,
	)
}

main()
