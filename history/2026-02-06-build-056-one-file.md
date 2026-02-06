# PROMPT_build execute one spec — 056 one file

**Task:** Find highest-priority INCOMPLETE spec, implement/verify, commit and push, output DONE.

**Done:**
- Executed spec 056 (formatting enforcement): one file per run. Formatted `src/collections/actor-coins.spec.ts` (inlined single-use `fractionalStr` in `formatBalance` return). Checked box and updated Status in spec.
- Unit tests: 44 Deno + 101 Vitest passed.

**Not done:**
- Spec 056 remains Incomplete (many unchecked files; one file per run).
- Spec 071 (RichTextarea): e2e prompt-input tests require webServer; `playwright.config.ts` webServer timed out after 120s. Cannot verify AC 7 without e2e pass.

**Exit:** No spec fully completed; DONE not output per constitution.
