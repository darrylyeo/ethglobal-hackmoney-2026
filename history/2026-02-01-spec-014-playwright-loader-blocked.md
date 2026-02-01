# Spec 014 E2E – Playwright loader blocked (2026-02-01)

All e2e tests fail with: `Playwright Test did not expect test.describe() to be called here` (currentlyLoadingFileSuite is null when test files run). Likely cause: out-of-process loader runs test files in a separate Node process where setCurrentlyLoadingFileSuite is called, but ESM/CJS or module resolution yields a different globals instance so the suite is never visible to the test code.

Tried: testDir/testMatch restricted to e2e only; .cts extension so fileIsModule=false; require('@playwright/test') in test file; CJS config. No change. Reverted to .ts and standard config.

Spec 014 acceptance criteria are implemented; E2E test execution is blocked until Playwright/Node loader behavior is resolved. Proceeding with re-verification of another spec (001) per constitution.
