# Spec 104: Farcaster Accounts

Add a Farcaster Accounts flow parallel to the regular Accounts flow. Users can add multiple Farcaster accounts via **Sign in with Farcaster** (SIWF, authenticated) or by **watching** (read-only, FID only). Lives under the Farcaster nav item. Uses a transport abstraction enum similar to `WalletConnectionTransport`.

## Scope

- New route: `/farcaster/accounts` – list and manage Farcaster accounts.
- Support multiple accounts per profile; add via SIWF or watch-by-FID.
- Transport enum: `FarcasterConnectionTransport` – `Siwf` (authenticated) and `Watch` (read-only).
- New collection: `farcasterConnectionsCollection` – persisted to localStorage, profile-scoped.
- Nav: Farcaster → Accounts (child). Flattened list of accounts as nav children.
- Reuse `SignInWithFarcaster`, `ensureFarcasterUser`, and existing Farcaster views.

## Non-goals

- Farcaster-native signing for on-chain actions (future SIWF integration with wallet flows).
- Migrating or removing the current single-user `farcaster-auth.svelte.ts` until migration path is defined; this spec adds a multi-account layer alongside it.

## Transport abstraction

Mirror `WalletConnectionTransport` from `$/data/WalletConnection.ts`:

```typescript
// $/data/FarcasterConnection.ts (new file)
export enum FarcasterConnectionTransport {
  Siwf = 'siwf',   // Sign in with Farcaster – authenticated, has verified signature
  Watch = 'watch', // Read-only – watching by FID, no auth
}
```

- **Siwf**: Account added via SIWF flow; signature verified; full profile (username, displayName, pfpUrl, etc.).
- **Watch**: Account added by FID; no signature; profile enriched from `farcasterUsersCollection` when available.

## Data model

### FarcasterConnection types

```typescript
// $/data/FarcasterConnection.ts
export type FarcasterConnection$Id = { fid: number }

export type FarcasterConnectionBase = {
  $id: FarcasterConnection$Id
  transport: FarcasterConnectionTransport
  username?: string
  displayName?: string
  pfpUrl?: string
  bio?: string
  selected: boolean
  connectedAt: number
}

export type FarcasterConnectionSiwf = FarcasterConnectionBase & {
  transport: FarcasterConnectionTransport.Siwf
  signedAt: number
}

export type FarcasterConnectionWatch = FarcasterConnectionBase & {
  transport: FarcasterConnectionTransport.Watch
}

export type FarcasterConnectionRow =
  | FarcasterConnectionSiwf
  | FarcasterConnectionWatch
```

### Collection

- **ID:** `CollectionId.FarcasterConnections` (add to `$/constants/collections.ts`)
- **Storage:** localStorage, profile-scoped (`getActiveProfileId()`).
- **Key:** `stringify({ fid })` or `fid:${fid}`.

## Farcaster connections collection API

Similar to `WalletConnections.ts`:

- `addFarcasterConnectionSiwf(user: FarcasterAuthUser)` – add/upsert from SIWF result.
- `addFarcasterConnectionWatch(fid: number)` – add watch-only; call `ensureFarcasterUser(fid)` to enrich profile.
- `removeFarcasterConnection(fid: number)` – remove from collection.
- `selectFarcasterConnection(fid: number)` – set `selected: true` for one, false for others.
- `farcasterConnectionsCollection` – createCollection with localStorage.

## Page layout

**Route:** `/farcaster/accounts`

Two sections (mirroring Accounts):

1. **Watching accounts**
   - List connections with `transport === FarcasterConnectionTransport.Watch`.
   - Dropdown “+” to add watching: FID input (number or `@username` if resolver exists).
   - Each item: avatar/username, FID, “Remove” button.

2. **Signed-in accounts**
   - List connections with `transport === FarcasterConnectionTransport.Siwf`.
   - “Sign in with Farcaster” button (reuse `SignInWithFarcaster`).
   - Each item: avatar, username/displayName, “Sign out” (remove from collection, optionally clear SIWF auth if it’s the same user).

Ordering: SIWF first, then Watch. Sort by `connectedAt` descending within each group.

## Navigation

- Add nav item: **Accounts** under Farcaster.
  - `id: 'farcaster-accounts'`
  - `title: 'Accounts'`
  - `href: '/farcaster/accounts'`
  - `icon: '👤'`
- **Flattened children:** one nav item per Farcaster connection.
  - `title`: `@${username}` or `@${fid}`
  - `href`: `/farcaster/user/${fid}`
  - `tag`: `Signed in` or `Watching` (from transport).
  - `icon`: pfp thumbnail when available, else default avatar.

## Migration from single-user auth

- **During implementation:** Keep `farcaster-auth.svelte.ts` as-is for components that rely on “current SIWF user” (e.g. SignInWithFarcaster, dashboard).
- When adding a SIWF account to `farcasterConnectionsCollection`, also call `setFarcasterAuthUser` for compatibility, or introduce a “primary”/selected Farcaster account concept.
- Future: deprecate single-user auth when all consumers use the connections collection.

## Integration points

- `SignInWithFarcaster`: on successful sign-in, call `addFarcasterConnectionSiwf(authUser)`.
- `ensureFarcasterUser`: used when adding a watch connection to fetch profile; also used by Farcaster user/cast pages.
- `WatchedEntities`: Farcaster user (FID) can still be watched independently; Farcaster Accounts are “my accounts”, Watched Entities are “pinned” entities. Optional: when adding a Farcaster account, also watch the user entity for nav consistency.

## Acceptance criteria

- [x] `FarcasterConnectionTransport` enum exists in `$/data/FarcasterConnection.ts`.
- [x] `farcasterConnectionsCollection` exists; persisted to localStorage, profile-scoped.
- [x] `addFarcasterConnectionSiwf`, `addFarcasterConnectionWatch`, `removeFarcasterConnection`, `selectFarcasterConnection` implemented.
- [x] Route `/farcaster/accounts` exists with list of SIWF and Watch accounts.
- [x] “Sign in with Farcaster” adds a Siwf connection.
- [x] “Add watching” (FID input) adds a Watch connection.
- [x] Each account row shows Remove/Sign out; removal works.
- [x] Nav: Farcaster → Accounts with flattened list of accounts; each links to `/farcaster/user/[fid]`; tag shows Signed in / Watching.

## Status

Complete.
