import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { markdownToHtml } from './markdown.ts'

const __dirname = dirname(fileURLToPath(import.meta.url))
const eip1Body = readFileSync(
	join(__dirname, 'markdown-fixtures', 'eip-1-body.md'),
	'utf-8',
)

describe('markdownToHtml', () => {
	it('does not throw for real EIP-1 body and returns string (rendered HTML or fallback)', () => {
		const out = markdownToHtml(eip1Body)
		expect(typeof out).toBe('string')
		expect(out.length).toBeGreaterThan(1000)
		expect(out).toContain('What is an EIP')
		expect(out).toContain('EIP stands for')
		expect(out).toContain('Ethereum Improvement Proposal')
		expect(out).toContain('Standards Track')
	})
	it('does not throw for empty string', () => {
		const out = markdownToHtml('')
		expect(typeof out).toBe('string')
		expect(out === '' || out === '<p></p>').toBe(true)
	})

	it('does not throw for plain text', () => {
		const out = markdownToHtml('Hello world')
		expect(out).toContain('Hello world')
	})

	it('does not throw for headings', () => {
		const out = markdownToHtml('# Title\n\n## Section\n\n### Subsection')
		expect(out).toContain('Title')
		expect(out).toContain('Section')
		expect(out).toContain('Subsection')
	})

	it('does not throw for bold and italic', () => {
		const out = markdownToHtml('**bold** and *italic*')
		expect(out).toContain('bold')
		expect(out).toContain('italic')
	})

	it('does not throw for lists', () => {
		const ul = markdownToHtml('- one\n- two\n- three')
		expect(ul).toContain('one')
		const ol = markdownToHtml('1. first\n2. second')
		expect(ol).toContain('first')
	})

	it('does not throw for inline code and code blocks', () => {
		const out = markdownToHtml('Use `code` and:\n\n```\nblock\n```')
		expect(out).toContain('code')
		expect(out).toContain('block')
	})

	it('does not throw for links', () => {
		const out = markdownToHtml('[EIP-1](https://eips.ethereum.org/EIPS/eip-1)')
		expect(out).toContain('eips.ethereum.org')
	})

	it('does not throw for blockquote', () => {
		const out = markdownToHtml('> quoted line')
		expect(out).toContain('quoted')
	})

	it('does not throw for EIP-style body with multiple elements', () => {
		const body = `
## Abstract
This proposal describes a standard.

## Motivation
We need this.

## Specification
\`\`\`
interface Example {
  value: string
}
\`\`\`

- Item one
- Item two

See [EIP-1](https://eips.ethereum.org/EIPS/eip-1).
`
		const out = markdownToHtml(body.trim())
		expect(out).toContain('Abstract')
		expect(out).toContain('Motivation')
		expect(out).toContain('Specification')
		expect(out).toContain('Example')
		expect(out).toContain('Item one')
		expect(out).toContain('eips.ethereum.org')
	})

	it('does not throw for CRLF and control chars (normalized retry)', () => {
		const out = markdownToHtml('line one\r\nline two')
		expect(out).toContain('line one')
		expect(out).toContain('line two')
	})

	it('returns sanitized HTML (no script)', () => {
		const out = markdownToHtml('Hi <script>alert(1)</script>')
		expect(out).not.toContain('<script>')
		expect(out).not.toContain('alert')
	})

	it('never throws', () => {
		const inputs = [
			'',
			'x',
			'# H1',
			'**b**',
			'`c`',
			'[l](https://x.y)',
			'- a\n- b',
			'1. a\n2. b',
			'> q',
			'```\ncode\n```',
			'---\nfrontmatter\n---',
			'\n\n\n',
			'\0null',
			'<div>html</div>',
		]
		for (const md of inputs) {
			expect(() => markdownToHtml(md)).not.toThrow()
		}
	})
})
