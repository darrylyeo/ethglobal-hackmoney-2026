export enum SelectorKind {
	Function = 'function',
	Event = 'event',
}

export type SelectorSignature$Id = {
	kind: SelectorKind
	hex: `0x${string}`
}

export type SelectorSignatureEntry = {
	$id: SelectorSignature$Id
	signatures: string[]
}
