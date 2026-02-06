/**
 * Sync asset SVGs (networks, coins, brands): download/unpack/optimize only sources not yet synced.
 * Writes to src/assets/{networks|coins|providers}/. Like a package manager: skip existing files.
 * Usage: deno run -A scripts/_sync-assets.ts [chain|coin|provider]
 */

import { unzipSync } from 'npm:fflate'
import { optimize } from 'npm:svgo'
import {
	AssetKind,
	assetFilename,
	chainAssetAliases,
	chainAssetSources,
	coinAssetSources,
	FetchTypeKind,
	isDefaultAsset,
	providerAssetSources,
	type AssetSource,
} from '../src/constants/assets.ts'

const subjectToDirKey = {
	Network: 'network',
	Coin: 'coin',
	Brand: 'provider',
} as const

const OUT_BASE = new URL('../src/assets/', import.meta.url)

const allSources: AssetSource[] = [
	...chainAssetSources,
	...coinAssetSources,
	...providerAssetSources,
]

function isSvgContent(text: string): boolean {
	const t = text.trim()
	return (
		t.startsWith('<?xml') ||
		t.startsWith('<svg') ||
		(t.startsWith('<!--') && t.includes('<svg'))
	)
}

function optimizeSvg(svg: string): string {
	const { data } = optimize(svg, { multipass: true })
	return data
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
	const subjectArg = Deno.args[0] as string | undefined
	const filter =
		subjectArg === 'chain' || subjectArg === 'coin' || subjectArg === 'provider'
			? subjectArg
			: null
	const items = filter
		? allSources.filter((item) => subjectToDirKey[item.subject] === filter)
		: allSources

	const writtenByDir = {
		networks: new Set<string>(),
		coins: new Set<string>(),
		providers: new Set<string>(),
	}
	const defaultSvgByChainId = new Map<number, string>()
	const zipCache = new Map<string, Record<string, Uint8Array>>()

	const dirs = ['networks', 'coins', 'providers'] as const
	for (const d of dirs) {
		await Deno.mkdir(new URL(d + '/', OUT_BASE), { recursive: true })
	}

	for (const item of items) {
		const { subject, id, kind, style, fetch: f } = item
		const kindNorm = kind ?? AssetKind.Logo
		const filename = assetFilename(id, kindNorm, style)
		const dirKey = subjectToDirKey[subject]
		const dirName = dirKey + 's'
		const path = new URL(dirName + '/' + filename, OUT_BASE)
		try {
			const exists = await Deno.stat(path).then(() => true).catch(() => false)
			if (exists) {
				console.log(`SKIP ${dirName}/${filename} (exists)`)
				writtenByDir[dirName].add(filename)
				if (subject === 'Network' && isDefaultAsset(kindNorm, style)) {
					const existing = await Deno.readTextFile(path)
					defaultSvgByChainId.set(Number(id), existing)
				}
				continue
			}
			let svg: string
			if (f.fetchType === FetchTypeKind.Zip) {
				let unzipped = zipCache.get(f.zipUrl)
				if (!unzipped) {
					const res = await fetch(f.zipUrl, { redirect: 'follow' })
					if (!res.ok) throw new Error(`${f.zipUrl} ${res.status}`)
					unzipped = unzipSync(new Uint8Array(await res.arrayBuffer())) as Record<
						string,
						Uint8Array
					>
					zipCache.set(f.zipUrl, unzipped)
				}
				const entry = unzipped[f.pathInZip]
				if (!entry) throw new Error(`missing in zip: ${f.pathInZip}`)
				svg = new TextDecoder().decode(entry)
			} else if (f.fetchType === FetchTypeKind.Png) {
				const res = await fetch(f.url, { redirect: 'follow' })
				if (!res.ok) throw new Error(`${f.url} ${res.status}`)
				const buf = await res.arrayBuffer()
				const b64 = btoa(String.fromCharCode(...new Uint8Array(buf)))
				svg = pngToSvgWrapper(b64)
			} else {
				svg = await fetchSvg(f.url)
			}
			const optimized = optimizeSvg(svg)
			await Deno.writeTextFile(path, optimized)
			writtenByDir[dirName].add(filename)
			if (subject === 'Network' && isDefaultAsset(kindNorm, style))
				defaultSvgByChainId.set(Number(id), optimized)
			console.log(`OK ${dirName}/${filename}`)
		} catch (e) {
			console.warn(
				`SKIP ${dirName}/${filename} (${f.fetchType}): ${e instanceof Error ? e.message : e}`,
			)
		}
	}

	if (!filter || filter === 'chain') {
		for (const { fromId, toId } of chainAssetAliases) {
			const tid = Number(fromId)
			const mid = Number(toId)
			const svg = defaultSvgByChainId.get(mid)
			if (!svg) continue
			const dest = new URL(`networks/${tid}.svg`, OUT_BASE)
			try {
				const exists = await Deno.stat(dest).then(() => true).catch(() => false)
				if (exists) {
					console.log(`SKIP networks/${tid}.svg (exists)`)
					writtenByDir.networks.add(`${tid}.svg`)
					continue
				}
				const optimized = optimizeSvg(svg)
				await Deno.writeTextFile(dest, optimized)
				writtenByDir.networks.add(`${tid}.svg`)
				console.log(`COPY networks/${tid}.svg <- ${mid}`)
			} catch {
				// ignore
			}
		}
	}

	const total =
		writtenByDir.networks.size +
		writtenByDir.coins.size +
		writtenByDir.providers.size
	console.log(
		`Done. ${total} files (networks: ${writtenByDir.networks.size}, coins: ${writtenByDir.coins.size}, providers: ${writtenByDir.providers.size}).`,
	)
}

main()
