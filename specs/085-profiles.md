# Spec 085: Profiles – local-first identity and data isolation

All local state — wallet connections, sessions, watched entities, dashboard
layouts, agent chats, LLM connections — is bucketed into a **profile** stored
in the browser. Users can create, rename, switch, export, import, and delete
profiles. Each profile has an auto-generated display name and emoji (reusing the
peer name system from rooms) that can be overridden.

## Data model

### Profile

```ts
type Profile = {
	id: string               // crypto.randomUUID()
	name: string             // default: generatePeerDisplayName() → "Bold Cat"
	emoji: string            // default: peerNameToEmoji(name) → "🐱"
	createdAt: number
	updatedAt: number
}
```

### ProfileMeta (root-level, outside any profile)

A single localStorage key `blockhead:profiles` stores profile metadata and the
active profile ID:

```ts
type ProfilesMeta = {
	version: 1
	activeProfileId: string
	profiles: Profile[]
}
```

This is **not** a TanStack DB collection — it's a plain JSON blob read/written
via `localStorage.getItem`/`setItem` with a `devalue` parser. It lives outside
the per-profile namespace so it's accessible before any profile is loaded.

## Storage namespacing

### Current state

Every `localStorageCollectionOptions` collection uses a flat `storageKey`:

| Collection | `storageKey` |
|---|---|
| `walletConnectionsCollection` | `wallet-connections` |
| `transactionSessionsCollection` | `transaction-sessions` |
| `watchedEntitiesCollection` | `watched-entities` |
| `dashboardPanelsCollection` | `dashboard-panels` |
| `agentChatTreesCollection` | `agent-chat-trees` |
| `agentChatTurnsCollection` | `agent-chat-turns` |
| `llmConnectionsCollection` | `llm-connections` |
| `transactionsCollection` | `bridge-transactions` |
| `actorCoinsCollection` | `actor-coins` |
| `actorAllowancesCollection` | `actor-allowances` |
| `storkPricesCollection` | `stork-prices` |
| `entitySourcesCollection` | `entity-sources` |
| `transactionSessionSimulationsCollection` | `transaction-session-simulations` |

### Namespaced state

Storage keys become `blockhead:${profileId}:${storageKey}`. For the active
profile `abc-123`, `wallet-connections` becomes
`blockhead:abc-123:wallet-connections`.

A helper replaces the current direct `storageKey` usage:

```ts
const profileStorageKey = (storageKey: string) =>
	`blockhead:${getActiveProfileId()}:${storageKey}`
```

All `localStorageCollectionOptions` calls pass `storageKey` through this helper.

### Migration

On first load when no `blockhead:profiles` key exists:

1. Create a default profile (`id: 'default'`, generated name/emoji).
2. For each known `storageKey`, copy the existing un-namespaced value to
   `blockhead:default:${storageKey}`.
3. Remove the un-namespaced key.
4. Write `ProfilesMeta` with `activeProfileId: 'default'`.

This is a one-time migration that preserves all existing user data.

### Profile-scoped vs. global collections

Not all collections need profile isolation. Classification:

| Scope | Collections | Reason |
|---|---|---|
| **Profile-scoped** | `wallet-connections`, `transaction-sessions`, `watched-entities`, `dashboard-panels`, `agent-chat-trees`, `agent-chat-turns`, `llm-connections`, `bridge-transactions`, `transaction-session-simulations`, `entity-sources` | User-specific state |
| **Global** | `actor-coins`, `actor-allowances`, `stork-prices`, `networks`, `coins`, `wallets`, `rooms`, `room-peers`, `my-peer-ids`, `verifications`, `evm-actor-profiles`, various query collections | Shared/cached data |

Global collections keep their current un-namespaced `storageKey` (or no storage
at all for query/localOnly collections). Only profile-scoped collections use the
`profileStorageKey` helper.

### Room peer identity

The persistent peer ID (`room-persistent-peer-id` in localStorage) and peer
display name (`room-peer-display-name` in sessionStorage) are currently global.
With profiles, these become profile-scoped:

- Peer ID: `blockhead:${profileId}:peer-id`
- Peer display name: defaults to `profile.name`

When switching profiles, the room connection should reconnect with the new
profile's peer identity.

## TanStack DB changes

### Collection re-initialization on profile switch

`localStorageCollectionOptions` reads from localStorage once at collection
creation time. Switching profiles means the collections need to read from new
storage keys. Two approaches:

**Option A: Recreate collections.** Destroy and recreate all profile-scoped
collections when switching. This is the cleanest approach — each collection gets
fresh data from the new profile's localStorage keys. Requires that collection
references are reactive (stored in `$state` or re-provided via context).

**Option B: Flush and reload.** Keep collection instances alive but:
1. Serialize current profile's collection state to its namespaced localStorage
   keys.
2. Clear the collection's in-memory state.
3. Load the new profile's data from its namespaced localStorage keys into the
   existing collection.

Option A is recommended because TanStack DB collections are cheap to create and
it avoids partial-state bugs. The implementation:

```ts
// src/lib/profile.ts
import { parse, stringify } from 'devalue'

const PROFILES_KEY = 'blockhead:profiles'

export const getProfilesMeta = (): ProfilesMeta => (
	parse(localStorage.getItem(PROFILES_KEY) ?? 'null')
	?? migrateAndCreateDefault()
)

export const getActiveProfileId = (): string =>
	getProfilesMeta().activeProfileId

export const profileStorageKey = (storageKey: string) =>
	`blockhead:${getActiveProfileId()}:${storageKey}`
```

```ts
// src/state/profile.svelte.ts
let activeProfileId = $state(getActiveProfileId())

export const switchProfile = (profileId: string) => {
	const meta = getProfilesMeta()
	meta.activeProfileId = profileId
	localStorage.setItem(PROFILES_KEY, stringify(meta))
	// Trigger full page reload to reinitialize all collections
	// (simplest correct approach; SPA-based re-init is a future optimization)
	location.reload()
}
```

A full page reload on profile switch is the simplest correct implementation.
Collections read their `storageKey` at creation time; `profileStorageKey` will
return the new prefix after `ProfilesMeta` is updated. No collection plumbing
changes needed.

Future optimization: SPA-based switch by re-creating collections in-place
without a reload, using a reactive `profileId` that triggers collection
recreation via `$effect`.

## Profile management

### `profilesCollection` (not a TanStack DB collection)

Profile CRUD operates directly on the `ProfilesMeta` blob:

```ts
export const createProfile = (overrides?: Partial<Pick<Profile, 'name' | 'emoji'>>): Profile
export const updateProfile = (id: string, updates: Partial<Pick<Profile, 'name' | 'emoji'>>): void
export const deleteProfile = (id: string): boolean  // cannot delete last profile
export const listProfiles = (): Profile[]
export const getActiveProfile = (): Profile
export const switchProfile = (id: string): void
```

### Avatar: unified with rooms

The profile's default `name` and `emoji` use the same generation logic as room
peers:

```ts
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
	let { name, emoji, size = '2rem' }: {
		name: string,
		emoji: string,
		size?: string,
	} = $props()

	import { peerNameToHue } from '$/lib/rooms/room.ts'
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
```

`Peer.svelte` refactored to use `<Avatar>`.

### Export

Export a profile to a JSON file. Filename:
`[Profile Name].v[schemaVersion].blockhead.json`

```ts
type ProfileExport = {
	$format: 'blockhead-profile'
	$version: 1                       // schema version for forward compat
	profile: Profile
	collections: Record<string, unknown[]>  // storageKey → array of rows
}
```

The export function:
1. Reads the profile metadata.
2. For each profile-scoped `storageKey`, reads
   `blockhead:${profileId}:${storageKey}` from localStorage.
3. Bundles into `ProfileExport` JSON.
4. Triggers download via `URL.createObjectURL` + `<a download>`.

### Import

Import a `.blockhead.json` file:
1. Validate `$format === 'blockhead-profile'`.
2. Validate `$version` is supported (currently only `1`).
3. Create a new profile (new `id`, keep imported `name` + `emoji` with
   " (imported)" suffix).
4. For each `storageKey` in `collections`, write to
   `blockhead:${newId}:${storageKey}` in localStorage.
5. Add profile to `ProfilesMeta`.
6. Optionally switch to the imported profile.

### Delete

1. Cannot delete the last remaining profile.
2. If deleting the active profile, switch to another first.
3. Remove all `blockhead:${profileId}:*` keys from localStorage.
4. Remove profile from `ProfilesMeta.profiles`.

## UI

### Profile switcher (nav sidebar footer)

Below the nav items, before the settings link:

- Shows `<Avatar>` + profile name of the active profile.
- Click to open a popover/dropdown:
  - List of all profiles, each with `<Avatar>` + name. Active profile
    highlighted.
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

- [ ] `ProfilesMeta` persisted in `blockhead:profiles` localStorage key.
- [ ] Default profile auto-created on first load with generated name + emoji.
- [ ] Migration: existing un-namespaced localStorage data moved to
  `blockhead:default:*` keys on first load.
- [ ] All profile-scoped collections use `profileStorageKey(storageKey)`.
- [ ] Global collections (prices, networks, coins, etc.) remain un-namespaced.
- [ ] Create new profile with auto-generated name + emoji.
- [ ] Edit profile name and emoji; changes persist.
- [ ] Switch between profiles; local state (sessions, watched entities, wallet
  connections, dashboards, etc.) is isolated per profile.
- [ ] Export profile to `[Name].v1.blockhead.json` with all profile-scoped
  collection data.
- [ ] Import `.blockhead.json` file creates a new profile with imported data.
- [ ] Delete profile removes all its namespaced localStorage keys; cannot delete
  last profile.
- [ ] `<Avatar>` component extracted from `Peer.svelte`, used by both rooms and
  profile UI.
- [ ] Profile switcher in nav sidebar shows active profile and allows switching.
- [ ] Room peer identity (peer ID, display name) is profile-scoped.
