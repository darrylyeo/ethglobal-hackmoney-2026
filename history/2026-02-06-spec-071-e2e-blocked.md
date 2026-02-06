# Spec 071 (RichTextarea) — E2E blocked

**Task:** PROMPT_build execute one spec. Picked highest-priority incomplete spec 071 (RichTextarea and RichTextareaReference).

**Done:**
- Fixed pre-existing build error: `src/api/llm/zen.ts` had a trailing comma after the `headers` object (line 74), causing "Expected identifier but found 'if'" (esbuild parsed it as comma expression).
- Verified all 7 acceptance criteria against code: RichTextarea.svelte, RichTextareaReference.svelte, EntityRefInput.svelte; props, bindings, key handling, parse/serialize, and EntityRefInput integration match the spec.
- Unit tests: `pnpm run test:unit` — 44 Deno + 101 Vitest passed.

**Blocked:**
- E2E prompt-input tests: Default `playwright.config.ts` webServer (deno task build && deno task preview) times out (120s, then tried 300s) before server is ready. With `playwright.no-server.config.ts`, got "Playwright Test did not expect test.describe() to be called here" (no tests found).
- Spec 071 AC 7 requires "e2e prompt-input tests pass"; cannot mark spec complete without that.

**2026-02-06 (this run):** Re-ran prompt-input e2e with webServer timeout 300_000; still timed out. Reverted timeout to 120_000. No code changes. Spec 071 remains highest-priority incomplete; exit without DONE per constitution ("If blocked: explain in history/, exit without phrase").
