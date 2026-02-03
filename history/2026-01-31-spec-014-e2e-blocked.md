# Spec 014 E2E bridge flow – blocked

**Date:** 2026-01-31

## Done

- **bridge-e2e.test.ts** under `src/routes/bridge/` with happy path, tx history, testnet/mainnet toggle, error handling (see earlier entry).
- Existing E2E and wallet tests updated; Playwright uses `pnpm run build && pnpm run preview`.

## Block

Bridge E2E tests **do not pass**: layout Boundary stays on "Loading..."; bridge page content (heading / "Connect a wallet") never appears within 45s.

## Investigation (2026-01-31 follow-up)

1. **SSR output**: For direct load of `/bridge`, initial HTML contains "Loading..." inside `#main` (Boundary pending). Scripts use relative paths `./_app/immutable/entry/...`. With document URL `/bridge`, `./_app` resolves to `/bridge/_app` → 404 in theory; in practice chunk load failure is a plausible cause.

2. **Tried (reverted)**:
   - **paths.relative: false** in svelte.config – no change; client bootstrap may still emit relative imports.
   - **`<base href="/">`** in app.html – no change.
   - **Load / then client-nav to /bridge**: root `+page.ts` redirects to `/bridge`; added `?noredirect=1` to skip redirect, goto `/?noredirect=1`, wait for `#main`, click Bridge link. First run: got to click, then timeout waiting for heading (bridge content still never appeared). So client-side nav to `/bridge` still leaves Boundary on "Loading..." (bridge route chunk or something inside bridge page never resolves).
   - **output.bundleStrategy: 'single'**: so root and bridge are in one bundle. Then goto `/?noredirect=1` → Bridge link never appeared within 60s (timeout on click). So even the **root** page content (nav with Bridge link) never rendered; Boundary stays pending for the root route too. Suggests the issue is not only bridge chunk load but any route content inside Boundary (or SvelteKit’s route injection) not resolving in Playwright.

3. **Conclusion**: Cause is likely either (a) SvelteKit’s route segment provided to the layout as a Promise that never resolves in the test environment, or (b) something in the app (e.g. TanStack svelte-db / useLiveQuery, or hydration) that suspends and never resolves there. All attempted fixes reverted; E2E and app behaviour unchanged.

## Exit

Spec 014 remains **not complete**. Exiting without DONE per PROMPT_build.md: "If blocked: explain in history/, exit without phrase."
