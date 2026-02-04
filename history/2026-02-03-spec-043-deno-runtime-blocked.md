# Spec 043: Deno runtime — blocked on E2E

- Updated docs, scripts, configs, and tasks to use Deno-first commands.
- Added missing Deno import-map entries required for build/preview in Deno.
- `deno task build`: passes (warnings only).
- `deno task test`: Deno + Vitest unit tests pass.
- `deno task test:e2e`: **failed**. Preview served but 18 tests failed (bridge/unified/route-coverage/wallet flows). Errors show missing expected UI elements (e.g. protocol selection, bridge UI text) and 404s for `/networks/999.svg` + `/networks/42161.svg`.
- Per constitution: E2E not verified; cannot output DONE.
