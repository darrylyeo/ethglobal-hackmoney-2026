/**
 * One-off: verify OpenCode Zen API with PUBLIC_OPENCODE_API_KEY.
 * Run from repo root: deno run -A scripts/_check-zen.ts
 * Loads .env from cwd if present.
 */

const key =
	Deno.env.get('PUBLIC_OPENCODE_API_KEY') ??
	(await loadEnv(Deno.cwd())).PUBLIC_OPENCODE_API_KEY

async function loadEnv(cwd: string): Promise<Record<string, string>> {
	const out: Record<string, string> = {}
	try {
		const raw = await Deno.readTextFile(`${cwd}/.env`)
		for (const line of raw.split('\n')) {
			const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/)
			if (m) out[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '')
		}
	} catch {
		// no .env
	}
	return out
}

if (!key) {
	console.error('PUBLIC_OPENCODE_API_KEY not set (env or .env)')
	Deno.exit(1)
}

const res = await fetch('https://opencode.ai/zen/v1/chat/completions', {
	method: 'POST',
	headers: {
		'content-type': 'application/json',
		authorization: `Bearer ${key}`,
	},
	body: JSON.stringify({
		model: 'big-pickle',
		messages: [
			{ role: 'user', content: 'Reply with exactly: Zen OK' },
		],
	}),
})

if (!res.ok) {
	console.error('Zen failed:', res.status, await res.text())
	Deno.exit(1)
}

const body = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> }
const text = body.choices?.[0]?.message?.content ?? ''
console.log('Zen OK. Response:', text.slice(0, 120) || '(no text)')
