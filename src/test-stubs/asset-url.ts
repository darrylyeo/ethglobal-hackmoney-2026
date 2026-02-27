/**
 * Stub for Deno test: resolves Vite-style `?url` asset imports.
 * Import map redirects e.g. `$/assets/coins/eth.svg?url` to this module with `?path=../assets/coins/eth.svg`.
 * Exports the resolved file URL so (await import('...?url')).default works.
 */
const path = new URL(import.meta.url).searchParams.get('path') ?? ''
export default new URL(path, import.meta.url).href
