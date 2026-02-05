#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { readdirSync } from 'fs'

const TWO_BLANK = '\n\n\n'

function walk(dir, exts, files = []) {
	for (const e of readdirSync(dir, { withFileTypes: true })) {
		const p = join(dir, e.name)
		if (
			e.isDirectory() &&
			!e.name.startsWith('.') &&
			e.name !== 'node_modules'
		) {
			walk(p, exts, files)
		} else if (e.isFile() && exts.some((ext) => e.name.endsWith(ext))) {
			files.push(p)
		}
	}
	return files
}

function normalizeScriptGroupSpacing(scriptBody) {
	return scriptBody.replace(
		/\n{1,2}(\t\s*\/\/\s*(?:Types\/constants|IDs|Context|Props|\(Derived\)|Functions|State|Actions|Components|Transitions\/animations|Styles|Images)\s*)$/gm,
		`${TWO_BLANK}$1`,
	)
}

const root = join(process.cwd(), 'src')
const svelteFiles = walk(root, ['.svelte'])
let changed = 0
for (const file of svelteFiles) {
	let content = readFileSync(file, 'utf8')
	const before = content
	content = content.replace(/<\/script>\n\n</g, `</script>${TWO_BLANK}<`)
	content = content.replace(
		/<\/svelte:head>\n\n</g,
		`</svelte:head>${TWO_BLANK}<`,
	)
	content = content.replace(/\n\n<style>/g, `${TWO_BLANK}<style>`)
	content = content.replace(
		/(<script[\s\S]*?>)([\s\S]*?)(<\/script>)/g,
		(_, open, body, close) => open + normalizeScriptGroupSpacing(body) + close,
	)
	if (content !== before) {
		writeFileSync(file, content)
		changed += 1
	}
}
console.log(
	`Updated ${changed} Svelte files for two empty lines between sections.`,
)
