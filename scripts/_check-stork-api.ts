/**
 * One-off: verify Stork REST API with token from env or .env file.
 * Run: deno run -A scripts/_check-stork-api.ts
 */

const envPath = new URL('../.env', import.meta.url)
try {
	const envText = await Deno.readTextFile(envPath)
	for (const line of envText.split('\n')) {
		const m = line.match(/^\s*(PUBLIC_STORK_REST_TOKEN|STORK_REST_TOKEN)\s*=\s*(.+?)\s*$/)
		if (m) Deno.env.set(m[1], m[2].replace(/^["']|["']$/g, ''))
	}
} catch {
	// .env optional if vars set in shell
}

const token = Deno.env.get('PUBLIC_STORK_REST_TOKEN') ?? Deno.env.get('STORK_REST_TOKEN')
if (!token) {
	console.error('No token. Set PUBLIC_STORK_REST_TOKEN or STORK_REST_TOKEN in .env or env.')
	Deno.exit(1)
}

const assetIds = ['BTCUSD', 'ETHUSD', 'XAUUSD', 'EURUSD', 'USDCUSD']
const baseUrls = [
	'https://rest.jp.stork-oracle.network/',
	'https://rest.dev.stork-oracle.network/',
]
let res: Response | undefined
for (const base of baseUrls) {
	const url = new URL('v1/prices/latest', base)
	url.searchParams.set('assets', assetIds.join(','))
	try {
		res = await fetch(url.toString(), {
			headers: { Authorization: `Basic ${token}` },
		})
		break
	} catch (e) {
		if (base === baseUrls[baseUrls.length - 1]) {
			console.error('Request failed:', e instanceof Error ? e.message : e)
			Deno.exit(1)
		}
	}
}
if (!res) Deno.exit(1)

const body = await res.text()
if (!res.ok) {
	console.error('Stork REST error:', res.status, body.slice(0, 300))
	Deno.exit(1)
}

let data: unknown
try {
	data = JSON.parse(body)
} catch {
	console.error('Invalid JSON:', body.slice(0, 200))
	Deno.exit(1)
}

const value =
	(data as { data?: { value?: unknown } })?.data?.value ??
	(data as { data?: unknown })?.data ??
	data
const entries =
	typeof value === 'object' && value !== null && !Array.isArray(value)
		? Object.entries(value as Record<string, unknown>)
		: []
if (entries.length === 0) {
	console.error('No prices in response. Keys:', Object.keys(data as object).join(', '))
	Deno.exit(1)
}

console.log(`Stork API OK: ${entries.length} price(s)`)
for (const [assetId, row] of entries) {
	const price = (row as { price?: string })?.price
	console.log(`  ${assetId}: ${price ?? '—'}`)
}
