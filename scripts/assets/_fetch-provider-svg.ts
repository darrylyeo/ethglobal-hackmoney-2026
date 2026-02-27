/**
 * One-off: fetch one provider SVG from Simple Icons and write optimized to src/assets/providers/.
 * Usage: deno run -A scripts/assets/_fetch-one-provider.ts <id> <url>
 * Example: deno run -A scripts/assets/_fetch-one-provider.ts covalent "https://cdn.simpleicons.org/covalent/375BD2"
 */
const [id, url] = Deno.args
if (!id || !url) {
	console.error('Usage: deno run -A scripts/assets/_fetch-one-provider.ts <id> <url>')
	Deno.exit(1)
}
const res = await fetch(url, { headers: { Accept: 'image/svg+xml' }, redirect: 'follow' })
if (!res.ok) throw new Error(`${url} ${res.status}`)
const text = await res.text()
if (!text.trim().startsWith('<svg') && !text.trim().startsWith('<?xml')) throw new Error('Not SVG')
const { optimize } = await import('npm:svgo')
const { data } = optimize(text, { multipass: true })
const out = new URL(`../../src/assets/providers/${id}.svg`, import.meta.url)
await Deno.writeTextFile(out, data)
console.log(`OK ${out.pathname}`)
