# Spec 014 E2E bridge flow – still blocked

**Date:** 2026-01-31

## Attempt

- Tried `kit.paths.relative: false` in svelte.config.js so script/asset URLs are absolute when loading /bridge directly. E2E still fails: #main shows "Loading..." and never shows "USDC Bridge" or "Connect a wallet" within 45s.
- Current layout has no Boundary around children(); "Loading..." comes from a Boundary somewhere (bridge page or SvelteKit client segment loading). Root cause remains: segment or something in the tree suspends and never resolves in the test environment.

## Exit

Spec 014 remains not complete. Exiting without DONE per PROMPT_build.md: "If blocked: explain in history/, exit without phrase."
