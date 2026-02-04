# Spec 046 blocked

## Summary
- `deno test -A` fails before running due to missing `e2e/test-setup.js`.
- DOM types are unavailable in the e2e tests (`document`, `HTMLElement`).

## Command
`deno test -A`

## Errors
- TS2307: Cannot find module `e2e/test-setup.js` (only `test-setup.ts` exists).
- TS2584/TS2304: Missing DOM lib types (`document`, `HTMLElement`).
