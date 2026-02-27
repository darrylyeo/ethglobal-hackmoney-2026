/**
 * Markdown → safe HTML via starkdown + insane. No raw HTML pass-through; links limited to http/https/mailto.
 * On parse error (e.g. unsupported token), normalizes input and retries once, then falls back to escaped plain text in <pre>.
 */

import insane from 'insane'
import { starkdown } from 'starkdown'

const escapeHtml = (s: string) =>
	s
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')

/** Fence at column 0 only (so nested indented ``` inside a code block are not treated as fences). */
const isFenceLineAtStart = (line: string) => /^`{3,}\s*[\w-]*$/.test(line)
const normalizeFenceLine = (line: string) =>
	line.replace(/^(`{3,})(\s*[\w-]*)$/, (_, run, rest) => '```' + rest)

/** Strip control chars; normalize fences at column 0 to 3 backticks; replace `` only outside code blocks so starkdown never sees empty inline code. */
const normalizeForStarkdown = (s: string) => {
	let inCodeBlock = false
	return s
		.replace(/\0/g, '')
		.replace(/\r\n/g, '\n')
		.replace(/\r/g, '\n')
		.split('\n')
		.map((line) => {
			if (isFenceLineAtStart(line)) {
				inCodeBlock = !inCodeBlock
				return normalizeFenceLine(line)
			}
			return inCodeBlock ? line : line.replace(/``/g, '`\u200B`')
		})
		.join('\n')
}

export const markdownToHtml = (markdownText: string): string => {
	try {
		return insane(
			starkdown(normalizeForStarkdown(markdownText)),
			{
					allowedSchemes: [
						'http',
						'https',
						'mailto',
					],
					allowedTags: [
						'a',
						'b',
						'blockquote',
						'br',
						'code',
						'div',
						'em',
						'h1',
						'h2',
						'h3',
						'h4',
						'h5',
						'h6',
						'hr',
						'i',
						'li',
						'ol',
						'p',
						'pre',
						'span',
						'strong',
						'table',
						'tbody',
						'td',
						'th',
						'thead',
						'tr',
						'ul',
						'img',
					],
					allowedAttributes: {
						a: ['href', 'target', 'rel'],
						img: ['src', 'alt'],
					},
			},
		)
	} catch {
		return `<pre>${escapeHtml(markdownText)}</pre>`
	}
}
