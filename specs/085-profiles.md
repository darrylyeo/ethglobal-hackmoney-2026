# Spec 085: Profiles – local-first identity and data isolation

All local state — wallet connections, sessions, watched entities, dashboard
layouts, agent chats, LLM connections — is bucketed into a **profile** stored
in the browser. Users can create, rename, switch, export, import, and delete
profiles. Each profile has an auto-generated display name and emoji (reusing the
peer name system from rooms) that can be overridden.

## Data model

### Profile

```typescript
type Profile = {
	id: string               // crypto.randomUUID()
	name: string             // default: generatePeerDisplayName() → "Bold Cat"
	emoji: string            // default: peerNameToEmoji(name) → "🐱"
	createdAt: number
	updatedAt: number
}
```

### ProfilesMeta (root-level, outside any profile)

A single localStorage key `blockhead.v1:profiles` stores profile metadata and
the active profile ID:

```typescript
type ProfilesMeta = {
	version: 1
	activeProfileId: string
	profiles: Profile[]
}
```

This is **not** a TanStack DB collection — it's a plain JSON blob read/written
via `localStorage.getItem`/`setItem` with `JSON.parse`/`JSON.stringify`. It
lives outside the per-profile namespace so it's accessible before any profile
is loaded.

## Storage namespacing

### Key format

All namespaced keys use the pattern:

```
blockhead.v1:<profileId>:<storageKey>
```

Examples:
- `blockhead.v1:abc-123:wallet-connections`
- `blockhead.v1:abc-123:watched-entities`

The `v1` segment is a schema version for the key format itself, enabling future
migrations if the namespace layout changes.

### Working-copy pattern

TanStack DB `localStorageCollectionOptions` uses a fixed `storageKey` at
creation time. Rather than changing collection definitions, we use a
**working-copy** approach:

- **Un-namespaced localStorage keys** (e.g. `wallet-connections`) are the
  "working copy" — always containing the active profile's data. TanStack DB
  reads from and writes to these keys as before. **Zero changes to collection
  definitions.**
- **Namespaced keys** (`blockhead.v1:<profileId>:<storageKey>`) are the
  "archive" — persisted snapshots of each profile's data.

### Profile-scoped vs. global collections

| Scope | storageKey values | Reason |
|---|---|---|
| **Profile-scoped** | `WalletConnections`, `Sessions`, `WatchedEntities`, `Dashboards`, `AgentChatTrees`, `AgentChatTurns`, `LlmConnections`, `BridgeTransactions`, `NetworkTransactions`, `SessionSimulations`, `EntitySources` (from `CollectionId`) | User-specific state |
| **Global** (not namespaced) | `ActorCoins`, `ActorAllowances`, `StorkPrices`, etc. | Shared cache; all other query/localOnly collections have no storageKey |

The list of profile-scoped `storageKey` values is maintained in a single
`PROFILE_SCOPED_STORAGE_KEYS` constant.

## Boot (migration)

On first load when no `blockhead.v1:profiles` key exists:

1. Create a default profile (`id: 'default'`, generated name/emoji).
2. For each profile-scoped `storageKey`, copy the existing un-namespaced value
   to `blockhead.v1:default:<storageKey>` (archive the working copy).
3. If `watched-entities` is empty, seed `DEFAULT_WATCHED_ENTITIES` (Ethereum,
   Base, Ethereum Sepolia, Base Sepolia, ETH, USDC, vitalik.eth).
4. Leave un-namespaced keys in place — they're the working copy.
5. Write `ProfilesMeta` with `activeProfileId: 'default'`.

On subsequent loads, the working copy already has the active profile's data
(TanStack DB keeps it up to date). No action needed.

Boot logic runs in a `<script>` side-effect imported before collections are
read, e.g. at the top of `+layout.svelte` or a shared init module.

## Profile switch (no reload)

Leverages TanStack DB's cross-tab `storage` event sync. The internal
`processStorageChanges()` diffs `lastKnownData` against freshly loaded
localStorage data and applies changes via the sync API (bypassing mutation
hooks, so no echo-back writes). We exploit this by updating localStorage and
dispatching synthetic `StorageEvent`s:

```typescript
const switchProfile = (newProfileId: string) => {
	const oldProfileId = getActiveProfileId()
	if (oldProfileId === newProfileId) return

	// 1. Archive: working copy → old profile's namespaced keys
	for (const key of PROFILE_SCOPED_STORAGE_KEYS) {
		const value = localStorage.getItem(key)
		if (value != null)
			localStorage.setItem(`blockhead.v1:${oldProfileId}:${key}`, value)
		else
			localStorage.removeItem(`blockhead.v1:${oldProfileId}:${key}`)
	}

	// 2. Restore: new profile's namespaced keys → working copy
	for (const key of PROFILE_SCOPED_STORAGE_KEYS) {
		const value = localStorage.getItem(`blockhead.v1:${newProfileId}:${key}`)
		if (value != null)
			localStorage.setItem(key, value)
		else
			localStorage.removeItem(key)
	}

	// 3. Update active profile
	updateActiveProfileId(newProfileId)

	// 4. Trigger re-sync: dispatch storage events so collections re-read
	for (const key of PROFILE_SCOPED_STORAGE_KEYS) {
		window.dispatchEvent(new StorageEvent('storage', {
			key,
			storageArea: localStorage,
		}))
	}

	// 5. Navigate to closest valid parent route
	goto('/')
}
```

Step 4 works because `localStorageCollectionOptions` registers a
`handleStorageEvent` listener that calls `processStorageChanges()` when
`event.key === storageKey && event.storageArea === storage`. This function:
1. Reads current data from `localStorage.getItem(storageKey)` (new profile's
   data).
2. Diffs against `lastKnownData` (old profile's data).
3. Applies deletes/inserts/updates via internal sync write (no echo back).
4. Updates `lastKnownData` to match the new data.

### Navigation on switch

Navigate to `/` on switch. Profile-scoped dynamic routes (e.g.
`/session/[id]`) may reference entities that don't exist in the new profile.
Future optimization: strip only profile-scoped dynamic segments to find the
closest valid static parent.

## Room peer identity

The persistent peer ID (`room-persistent-peer-id` in localStorage) and peer
display name (`room-peer-display-name` in sessionStorage) become
profile-scoped:

- Peer ID: add to `PROFILE_SCOPED_STORAGE_KEYS` as
  `room-persistent-peer-id`.
- Peer display name: default to `profile.name` instead of generating a
  separate name.

When switching profiles, room connections should reconnect with the new
profile's peer identity.

## Avatar: unified with rooms

The profile's default `name` and `emoji` use the same generation logic as room
peers:

```typescript
import { generatePeerDisplayName, peerNameToEmoji } from '$/lib/rooms/room.ts'

const name = generatePeerDisplayName()    // "Bold Cat"
const emoji = peerNameToEmoji(name, id)   // "🐱"
```

Users can override both. The `<Peer>` component's avatar rendering (colored
circle + emoji + name) should be extracted into a shared `<Avatar>` component
used by both rooms and profiles:

```svelte
<!-- src/components/Avatar.svelte -->
<script lang="ts">
	import { peerNameToHue } from '$/lib/rooms/room.ts'

	let { name, emoji, size = '2rem' }: {
		name: string,
		emoji: string,
		size?: string,
	} = $props()
</script>

<span
	class="avatar"
	role="img"
	aria-label={name}
	style="
		--size: {size};
		--bg: oklch(0.65 0.2 {peerNameToHue(name)});
	"
>
	{emoji}
</span>

<style>
	.avatar {
		width: var(--size);
		height: var(--size);
		border-radius: 50%;
		font-size: calc(var(--size) * 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--bg);
	}
</style>
```

`Peer.svelte` refactored to use `<Avatar>`.

## Profile management API

```typescript
// src/lib/profile.ts

export const createProfile = (
	overrides?: Partial<Pick<Profile, 'name' | 'emoji'>>,
): Profile  // seeds WatchedEntities with DEFAULT_WATCHED_ENTITIES for the new profile
export const updateProfile = (
	id: string,
	updates: Partial<Pick<Profile, 'name' | 'emoji'>>,
): void
export const deleteProfile = (id: string): boolean  // cannot delete last
export const switchProfile = (id: string): void
export const listProfiles = (): Profile[]
export const getActiveProfile = (): Profile
export const getActiveProfileId = (): string
```

## Export / Import

### Export

Filename: `[Profile Name].v1.blockhead.json`

```typescript
type ProfileExport = {
	$format: 'blockhead-profile'
	$version: 1
	profile: Profile
	collections: Record<string, string>  // storageKey → raw localStorage value
}
```

The export function reads raw localStorage strings for each profile-scoped key
under `blockhead.v1:<profileId>:*`. This preserves the exact TanStack DB
serialization format without needing to know its internals.

### Import

1. Validate `$format === 'blockhead-profile'` and `$version` is supported.
2. Create a new profile (new `id`, keep imported `name` + `emoji`).
3. For each `storageKey` in `collections`, write to
   `blockhead.v1:<newId>:<storageKey>`.
4. Add profile to `ProfilesMeta`.
5. Optionally switch to the imported profile.

### Delete

1. Cannot delete the last remaining profile.
2. If deleting the active profile, switch to another first.
3. Remove all `blockhead.v1:<profileId>:*` keys from localStorage.
4. Remove profile from `ProfilesMeta.profiles`.

## UI

### Profile switcher (nav sidebar footer)

Below the nav items:

- Shows `<Avatar>` + profile name of the active profile.
- Click to open a popover/dropdown:
  - List of all profiles, each with `<Avatar>` + name. Active highlighted.
  - Click a profile to switch.
  - "New Profile" button → creates + switches.
  - Gear icon per profile → edit name/emoji, export, delete.

### Profile settings page (`/settings/profiles`)

Full profile management:

- List all profiles with `<Avatar>`, name, created date.
- Edit name and emoji inline.
- Export button per profile.
- Import button (file picker for `.blockhead.json`).
- Delete button (with confirmation, disabled if last profile).
- "New Profile" button.

## Acceptance criteria

- [x] `ProfilesMeta` persisted in `blockhead.v1:profiles` localStorage key.
- [x] Default profile auto-created on first load with generated name + emoji.
- [x] Migration: existing un-namespaced localStorage data archived to
  `blockhead.v1:default:*` keys on first load.
- [x] `PROFILE_SCOPED_STORAGE_KEYS` constant lists all profile-scoped keys.
- [x] Profile switch archives old profile, restores new, dispatches synthetic
  `StorageEvent`s to re-sync collections, and navigates to `/`.
- [x] Global collections (prices, networks, coins, etc.) remain un-namespaced.
- [x] Create new profile with auto-generated name + emoji; WatchedEntities seeded with `DEFAULT_WATCHED_ENTITIES` (Ethereum, Base, Ethereum Sepolia, Base Sepolia, ETH, USDC, vitalik.eth).
- [x] Edit profile name and emoji; changes persist.
- [x] Switching profiles isolates local state (sessions, watched entities,
  wallet connections, dashboards, etc.) per profile.
- [x] Export profile to `[Name].v1.blockhead.json` with raw localStorage data.
- [x] Import `.blockhead.json` file creates a new profile with imported data.
- [x] Delete profile removes all its namespaced localStorage keys; cannot
  delete last profile.
- [x] `<Avatar>` component extracted from `Peer.svelte`, used by both rooms
  and profile UI.
- [x] Profile switcher in nav sidebar shows active profile and allows
  switching.
- [x] Room peer identity (peer ID, display name) is profile-scoped.
- [x] E2E tests create a dedicated test profile before every test and discard
  it after.

## Status

Complete. 2026-02-21 (PROMPT_build execute one spec): E2E profile isolation AC marked done. Profile fixture in `e2e/fixtures/profile.ts` seeds test profile via `context.addInitScript`; all e2e test files import from profile.ts, tevm.ts, or mock-clearnode.ts; Playwright discards context after each test (no explicit cleanup). _minimal.test.ts updated to use profile fixture.

## E2E test isolation

### Problem

E2E tests inject mock/Tevm wallets and seed localStorage with test data
(sessions, wallet connections, etc.). Without profile isolation, this data lands
in the user's default profile, polluting their real browsing state.

### Solution — profile fixture

All test files import `{ test, expect }` from `e2e/fixtures/profile.ts` (or a
fixture that extends it). The profile fixture overrides the `context` fixture to
inject an `addInitScript` that:

1. Writes a `blockhead.v1:profiles` meta entry with a single **test profile**
   (`id: 'e2e-test-profile'`, `name: 'E2E Test'`).
2. Sets `activeProfileId` to the test profile.

Because Playwright gives each test a **fresh BrowserContext** (empty
localStorage), the working-copy keys start empty — a clean slate. When the app
boots, `ensureProfilesMeta()` finds the pre-seeded meta and skips the migration
path. All subsequent collection writes go to the un-namespaced working-copy
keys, which belong to the test profile.

After the test, the browser context is discarded — no cleanup needed.

### Fixture hierarchy

```
e2e/fixtures/profile.ts        ← base (context fixture injects test profile init script)
  e2e/fixtures/tevm.ts          ← extends profile (adds Tevm memory node)
  e2e/fixtures/mock-clearnode.ts ← extends profile (adds mock WebSocket)
```

Every test file imports `test`/`expect` from one of these — **never** from
`@playwright/test` directly. The profile fixture overrides the `context`
fixture so the test profile is seeded automatically; no per-file
`beforeEach(useProfileIsolation)` needed.

### Seeding test data

`seedLocalStorageCollection` and `seedLocalStorageCollectionViaPage` (from
`e2e/coverage-helpers.ts`) write to un-namespaced keys. This is correct — they
write to the working copy, which belongs to the test profile. No changes needed.

### Test profile constant

```typescript
// e2e/fixtures/profile.ts
const E2E_PROFILE_ID = 'e2e-test-profile'
```

Tests that need the profile ID (e.g. to assert profile-scoped behavior) can
import or hardcode this value.

### Playwright test discovery (research)

**Current failure:** `Error: Playwright Test did not expect test.describe() to be called here` when running `playwright test --list` or `playwright test`. Root cause: `currentlyLoadingFileSuite()` is null when test files run — i.e. the loader’s “current file suite” is not set in the process that executes the test file.

**Findings:**

- Same error with direct `import { test } from '@playwright/test'` and with `import { test } from './fixtures/profile.ts'`; not caused by the fixture.
- Same for `.ts` and `.js` test files; not specific to TypeScript.
- A minimal repo (only `"type": "module"`, `@playwright/test`, one test file, one config) **works**; the failure is specific to this project’s environment.
- This project has multiple Playwright installs: `node_modules/.pnpm/playwright@1.57.0` and `node_modules/.deno/playwright@*`; only one is used by `deno run -A npm:playwright`, but duplicate installs can still affect resolution in some setups.
- Playwright sets the suite in `testLoader.loadTestFile()` before `requireOrImport(file)`; with `e2e/package.json` `"type": "commonjs"` the loader uses `require()` for e2e files, so the file runs synchronously in the same process — in theory the suite should be set. The failure suggests either the suite is cleared before the file runs (e.g. by an `await` and another loader path) or a different Playwright/globals instance is used when the test file runs.

**Correct setup (once discovery works):**

- Run e2e with: `deno task test:e2e` (or `deno run -A npm:playwright test -c playwright.e2e.config.ts`).
- Config: `playwright.e2e.config.ts` — `testDir: 'e2e'`, `testMatch: '**/*.test.ts'`, `webServer` for app + Tevm RPC.
- Test files import `{ test, expect }` from `e2e/fixtures/profile.ts` or `e2e/fixtures/tevm.ts` (or `mock-clearnode.ts`); profile fixture ensures a dedicated test profile per run.
- Optional: `e2e/package.json` with `"type": "commonjs"` so Playwright loads e2e files via `require()` (same-process, suite set before run). This did not fix the issue in this repo but is the recommended layout for “no ESM loader” for test files.

**Next steps:** Try Playwright 1.58+; reduce or isolate deps (e.g. run e2e from a minimal subproject that only depends on `@playwright/test`); or open an issue with Playwright with a repro that includes this project’s dependency set.
