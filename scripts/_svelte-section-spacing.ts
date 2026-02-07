/**
 * Enforces exactly two blank lines between Svelte sections (script, head, template, style)
 * and between comment-delimited groups in <script>. Run: deno run -A scripts/_svelte-section-spacing.ts
 */
import { dirname, fromFileUrl, join } from 'jsr:@std/path'

const TWO_BLANK = '\n\n\n'

const SECTION_NAMES = [
	'Types/constants',
	'IDs',
	'Context',
	'Props',
	'(Derived)',
	'Functions',
	'State',
	'Actions',
	'Components',
	'Transitions/animations',
	'Transitions',
	'Styles',
	'Images',
]
const sectionCommentPattern = SECTION_NAMES
	.map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\//g, '\\/'))
	.join('|')
const SECTION_COMMENT = new RegExp(
	`\\n+(\\s*//\\s*(?:${sectionCommentPattern})\\s*)$`,
	'gm',
)

function normalizeScriptGroupSpacing(body: string): string {
	return body.replace(SECTION_COMMENT, `${TWO_BLANK}$1`)
}

function normalizeBetweenSections(content: string): string {
	return content
		.replace(
			/(<\/script>)\s*\n[\s\S]*?\n(\s*<[\s\S]*?>)/g,
			(_, close, indentAndTag) => `${close}${TWO_BLANK}${indentAndTag}`,
		)
		.replace(
			/(<\/svelte:head>)\s*\n[\s\S]*?\n(\s*<[\s\S]*?>)/g,
			(_, close, indentAndTag) => `${close}${TWO_BLANK}${indentAndTag}`,
		)
		.replace(/\n+(\s*<style[\s\S]*?>)/g, `${TWO_BLANK}$1`)
}

function normalizeScriptBlocks(content: string): string {
	return content.replace(
		/(<script[\s\S]*?>)([\s\S]*?)(<\/script>)/g,
		(_, open, body, close) => (
			open + normalizeScriptGroupSpacing(body) + close
		),
	)
}

async function findSvelteFiles(dir: string): Promise<string[]> {
	const out: string[] = []
	for await (const e of Deno.readDir(dir)) {
		const p = join(dir, e.name)
		if (e.isDirectory && !e.name.startsWith('.') && e.name !== 'node_modules')
			out.push(...(await findSvelteFiles(p)))
		else if (e.isFile && e.name.endsWith('.svelte'))
			out.push(p)
	}
	return out
}

const projectRoot = dirname(dirname(fromFileUrl(import.meta.url)))
const srcDir = join(projectRoot, 'src')

const svelteFiles = await findSvelteFiles(srcDir)
let changed = 0
for (const file of svelteFiles) {
	let content = await Deno.readTextFile(file)
	const before = content
	content = normalizeBetweenSections(content)
	content = normalizeScriptBlocks(content)
	if (content !== before) {
		await Deno.writeTextFile(file, content)
		changed += 1
	}
}
console.log(
	`Updated ${changed} Svelte files for exactly two empty lines between sections.`,
)
