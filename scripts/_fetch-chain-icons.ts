/**
 * Legacy: fetch chain SVG icons to static/networks/. Prefer running scripts/_fetch-icons.ts (writes to static/icons/chains/).
 * Run: bun run scripts/_fetch-chain-icons.ts then deno task icons:optimize (svgo).
 */

import { unzipSync } from 'npm:fflate'
import { chainIconAliases, chainIconFetchItems } from '../src/constants/chain-icon-fetch-items.ts'
import {
	iconSuffix,
	IconKind,
	isDefaultIcon,
} from '../src/constants/icons.ts'

const OUT_DIR = new URL('../static/networks/', import.meta.url)

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

async function main() {
	const written = new Set<string>()
	const defaultSvgByChainId = new Map<number, string>()
	const zipCache = new Map<string, Record<string, Uint8Array>>()
	for (const { id, kind, style, fetch: f } of chainIconFetchItems) {
		const numId = Number(id)
		const iconKind = kind ?? IconKind.Logo
		try {
			if (f.fetchType === 'zip') {
				let unzipped = zipCache.get(f.zipUrl)
				if (!unzipped) {
					const res = await fetch(f.zipUrl, { redirect: 'follow' })
					if (!res.ok) throw new Error(`${f.zipUrl} ${res.status}`)
					const buf = await res.arrayBuffer()
					unzipped = unzipSync(new Uint8Array(buf)) as Record<string, Uint8Array>
					zipCache.set(f.zipUrl, unzipped)
				}
				const entry = unzipped[f.pathInZip]
				if (!entry) throw new Error(`missing in zip: ${f.pathInZip}`)
				const svg = new TextDecoder().decode(entry)
				const suffix = iconSuffix(iconKind, style)
				const filename = suffix ? `${numId}-${suffix}.svg` : `${numId}.svg`
				const path = new URL(filename, OUT_DIR)
				await Bun.write(path, svg)
				written.add(filename)
				if (isDefaultIcon(iconKind, style)) defaultSvgByChainId.set(numId, svg)
				console.log(`OK ${filename} (from ZIP)`)
			} else if (f.fetchType === 'png') {
				const res = await fetch(f.url, { redirect: 'follow' })
				if (!res.ok) throw new Error(`${f.url} ${res.status}`)
				const buf = await res.arrayBuffer()
				const b64 = Buffer.from(buf).toString('base64')
				const svg = pngToSvgWrapper(b64)
				const suffix = iconSuffix(iconKind, style)
				const filename = suffix ? `${numId}-${suffix}.svg` : `${numId}.svg`
				const path = new URL(filename, OUT_DIR)
				await Bun.write(path, svg)
				written.add(filename)
				if (isDefaultIcon(iconKind, style)) defaultSvgByChainId.set(numId, svg)
				console.log(`OK ${filename} (PNG wrapped)`)
			} else {
				const svg = await fetchSvg(f.url)
				const suffix = iconSuffix(iconKind, style)
				const filename = suffix ? `${numId}-${suffix}.svg` : `${numId}.svg`
				const path = new URL(filename, OUT_DIR)
				await Bun.write(path, svg)
				written.add(filename)
				if (isDefaultIcon(iconKind, style)) defaultSvgByChainId.set(numId, svg)
				console.log(`OK ${filename}`)
			}
		} catch (e) {
			const suffix = iconSuffix(iconKind, style)
			console.warn(
				`SKIP ${numId}${suffix ? `-${suffix}` : ''} (${f.fetchType}): ${e instanceof Error ? e.message : e}`,
			)
		}
	}

	for (const { fromId, toId } of chainIconAliases) {
		const tid = Number(fromId)
		const mid = Number(toId)
		const svg = defaultSvgByChainId.get(mid)
		if (!svg) continue
		try {
			const dest = new URL(`${tid}.svg`, OUT_DIR)
			await Bun.write(dest, svg)
			written.add(`${tid}.svg`)
			console.log(`COPY ${tid}.svg <- ${mid}`)
		} catch {
			// ignore
		}
	}

	console.log(
		`Done. ${written.size} files in static/networks. Run: deno task icons:optimize`,
	)
}

if (import.meta.main) main()
