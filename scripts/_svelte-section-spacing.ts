#!/usr/bin/env -S deno run -A
/**
 * Enforces exactly two blank lines between Svelte sections and between
 * comment groups in <script>. Spec 075, 056.
 * Usage: deno run -A scripts/_svelte-section-spacing.ts [path ...]
 */

const TWO_BLANK = '\n\n\n'

async function main(): Promise<void> {
	for (const p of Deno.args) {
		if (!p.endsWith('.svelte')) continue
		let content: string
		try {
			content = await Deno.readTextFile(p)
		} catch (e) {
			console.error(p, e)
			continue
		}
		const fixed = content.replace(/(\n\n)\n+/g, TWO_BLANK)
		if (fixed !== content) {
			await Deno.writeTextFile(p, fixed)
			console.log(p)
		}
	}
}

main()
