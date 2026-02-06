/**
 * Enforces exactly two blank lines between Svelte sections (script, head, template, style)
 * and between comment-delimited groups in <script>. Normalizes any run of newlines to
 * exactly two blank lines. Run: deno run -A scripts/_svelte-section-spacing.ts
 */
const TWO_BLANK = '\n\n\n'

const SECTION_COMMENT =
	/\n+(\t\s*\/\/\s*(?:Types\/constants|IDs|Context|Props|\(Derived\)|Functions|State|Actions|Components|Transitions\/animations|Transitions|Styles|Images)\s*)$/gm

function normalizeScriptGroupSpacing(scriptBody: string): string {
	return scriptBody.replace(SECTION_COMMENT, `${TWO_BLANK}$1`)
}

async function walk(
	dir: string,
	exts: string[],
	files: string[] = [],
): Promise<string[]> {
	for await (const e of Deno.readDir(dir)) {
		const p = `${dir}/${e.name}`
		if (e.isDirectory && !e.name.startsWith('.') && e.name !== 'node_modules') {
			await walk(p, exts, files)
		} else if (e.isFile && exts.some((ext) => e.name.endsWith(ext))) {
			files.push(p)
		}
	}
	return files
}

const root = `${Deno.cwd()}/src`
const svelteFiles = await walk(root, ['.svelte', ])
let changed = 0
for (const file of svelteFiles) {
	let content = await Deno.readTextFile(file)
	const before = content
	content = content.replace(
		/(<\/script>)\s*\n+(\s*<)/g,
		(_, close, next) => (`${close}${TWO_BLANK}${next}`),
	)
	content = content.replace(
		/(<\/svelte:head>)\s*\n+(\s*<)/g,
		(_, close, next) => (`${close}${TWO_BLANK}${next}`),
	)
	content = content.replace(/\n+(\s*<style>)/g, `${TWO_BLANK}$1`)
	content = content.replace(
		/(<script[\s\S]*?>)([\s\S]*?)(<\/script>)/g,
		(_, open: string, body: string, close: string) => (
			open + normalizeScriptGroupSpacing(body) + close
		),
	)
	if (content !== before) {
		await Deno.writeTextFile(file, content)
		changed += 1
	}
}
console.log(
	`Updated ${changed} Svelte files for exactly two empty lines between sections.`,
)
