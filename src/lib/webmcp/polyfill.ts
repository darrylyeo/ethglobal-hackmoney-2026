/** Load @mcp-b/global polyfill when native navigator.modelContext is missing. */
export const loadPolyfill = async (): Promise<void> => {
	if ('modelContext' in navigator) return
	try {
		await import('@mcp-b/global')
	} catch {
		// Polyfill not installed or load failed; caller will skip registration
	}
}
