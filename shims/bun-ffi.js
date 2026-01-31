/**
 * Stub for bun:ffi when running under Deno so @tevm/voltaire (main/provider)
 * can load in unit tests. Mapped in deno.json only. Not used by Playwright e2e
 * (Node) or the app bundle (we use @tevm/voltaire/Abi and /Hex subpaths only).
 */
const stub = Symbol('stub')
export const FFIType = {
	cstring: stub,
	ptr: stub,
	i32: stub,
	u64: stub,
	bool: stub,
	void: stub,
}
export function dlopen() {
	return { symbols: {} }
}
