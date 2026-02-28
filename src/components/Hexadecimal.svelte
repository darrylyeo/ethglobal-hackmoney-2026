<script lang="ts">
	// Props
	let {
		value = '',
		bytesPerLine = 16,
		groupSize = 4,
		showOffset = true,
		showAscii = true,
		class: className,
	}: {
		value?: string
		bytesPerLine?: number
		groupSize?: number
		showOffset?: boolean
		showAscii?: boolean
		class?: string
	} = $props()

	// (Derived)
	const normalized = $derived(
		value
			.trim()
			.replace(/^0x/i, '')
			.replace(/\s/g, '')
			.replace(/[^0-9a-fA-F]/g, ''),
	)
	const bytes = $derived(
		normalized.length % 2 === 0
			? normalized.match(/.{2}/g) ?? []
			: (normalized.slice(0, -1).match(/.{2}/g) ?? []),
	)
	const lines = $derived(
		(bytes.length
			? Array.from(
					{ length: Math.ceil(bytes.length / bytesPerLine) },
					(_, i) => {
						const start = i * bytesPerLine
						const lineBytes = bytes.slice(start, start + bytesPerLine)
						return {
							offset: start,
							bytes: lineBytes,
						}
					},
				)
			: []) as { offset: number; bytes: string[] }[],
	)
	function lineGroups(byteList: string[]): string[] {
		return byteList
			.reduce<string[][]>((acc, b, i) => {
				const g = Math.floor(i / groupSize)
				if (!acc[g]) acc[g] = []
				acc[g].push(b)
				return acc
			}, [])
			.map((g) => g.join(''))
	}
	function asciiGroup(byteList: string[]): string {
		return byteList
			.map((b) => {
				const n = Number.parseInt(b, 16)
				return n >= 32 && n < 127 ? String.fromCodePoint(n) : '.'
			})
			.join('')
	}
</script>


<pre
	data-card
	class="hex-viewer {className ?? ''}"
	role="img"
	aria-label="Hexadecimal dump"
>{#if lines.length === 0}<span class="hex-empty">—</span>{:else}{#if showOffset}<span class="hex-col hex-col-offset">{#each lines as { offset }}<span class="hex-cell">{offset.toString(16).padStart(8, '0')}</span>{/each}</span>{/if}<span class="hex-col hex-col-bytes">{#each lines as { bytes: lineBytes }}<span class="hex-cell">{#each lineGroups(lineBytes) as g}<span class="hex-group">{g}</span>{/each}</span>{/each}</span>{#if showAscii}<span class="hex-col hex-col-ascii">{#each lines as { bytes: lineBytes }}<span class="hex-cell">{asciiGroup(lineBytes)}</span>{/each}</span>{/if}{/if}</pre>


<style>
	.hex-viewer {
		display: grid;
		column-gap: 1ch;
		font-family: var(--fontFamily-monospace);
		font-size: 0.875em;
		line-height: 1.4;
		margin: 0;
		overflow-x: auto;
	}
	.hex-viewer:has(.hex-col-offset):has(.hex-col-ascii) {
		grid-template-columns: 8ch 1fr auto;
	}
	.hex-viewer:has(.hex-col-offset):not(:has(.hex-col-ascii)) {
		grid-template-columns: 8ch 1fr;
	}
	.hex-viewer:not(:has(.hex-col-offset)):has(.hex-col-ascii) {
		grid-template-columns: 1fr auto;
	}
	.hex-viewer:not(:has(.hex-col-offset)):not(:has(.hex-col-ascii)) {
		grid-template-columns: 1fr;
	}
	.hex-col {
		display: flex;
		flex-direction: column;
		row-gap: 0.15em;
	}
	.hex-col-offset {
		color: var(--color-fg-muted, #666);
		user-select: none;
	}
	.hex-col-bytes .hex-cell > .hex-group:not(:first-child) {
		margin-inline-start: 1ch;
	}
	.hex-col-ascii {
		color: var(--color-fg-muted, #666);
		white-space: pre;
	}
	.hex-cell {
		display: block;
	}
	.hex-empty {
		grid-column: 1 / -1;
		color: var(--color-fg-muted, #666);
	}
</style>
