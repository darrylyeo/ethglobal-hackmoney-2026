/**
 * Stub for bun:ffi when running under Deno/Node so @tevm/voltaire provider/main
 * bundles load. Only used when "bun:ffi" is mapped here via import map.
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
