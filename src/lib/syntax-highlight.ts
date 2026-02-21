/**
 * Syntax highlighting via @speed-highlight/core.
 * ~2kB core + ~1kB per language. Solidity (.sol) uses js grammar.
 */

import { highlightElement } from '@speed-highlight/core'

export type ShjLanguage =
	| 'asm'
	| 'bash'
	| 'c'
	| 'css'
	| 'go'
	| 'html'
	| 'java'
	| 'js'
	| 'md'
	| 'py'
	| 'rs'
	| 'sql'
	| 'ts'
	| 'xml'

const LANG_BY_EXT: Record<string, ShjLanguage> = {
	'.sol': 'js',
	'.js': 'js',
	'.ts': 'ts',
	'.jsx': 'js',
	'.tsx': 'ts',
	'.json': 'js',
	'.html': 'html',
	'.htm': 'html',
	'.css': 'css',
	'.md': 'md',
	'.py': 'py',
	'.rs': 'rs',
	'.go': 'go',
	'.sql': 'sql',
	'.xml': 'xml',
	'.c': 'c',
	'.sh': 'bash',
}

export function langForPath(path: string) {
	const ext = path.slice(path.lastIndexOf('.'))
	return LANG_BY_EXT[ext] ?? 'plain'
}

export async function highlightElementForPath(
	elm: HTMLElement,
	path: string,
) {
	const lang = langForPath(path)
	await highlightElement(elm, lang, 'multiline', { hideLineNumbers: true })
}

export async function highlightElementWithLang(
	elm: HTMLElement,
	lang: ShjLanguage,
	multiline = true,
) {
	await highlightElement(
		elm,
		lang,
		multiline ? 'multiline' : 'oneline',
		{ hideLineNumbers: true },
	)
}
