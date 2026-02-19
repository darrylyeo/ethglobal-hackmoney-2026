# Spec 103: Farcaster client and node providers

Add a Farcaster client that displays feeds, posts, and users using existing components (`EntityView`, `TreeNode`). Leverage TanStack DB for local caching, schema modeling, and live queries per spec 065. Include a research section on the Farcaster protocol and node providers.

## Research: Farcaster protocol and node providers (Feb 2025)

### Protocol layer

- **Snapchain**: Farcaster’s scalable hub implementation (Rust, open-source). Processes 10k+ txs/sec, low operational cost.
  - Ports: 3381 (HTTP), 3382 (gossip), 3383 (gRPC).
  - [Migrating to Snapchain](https://docs.farcaster.xyz/hubble/migrating)
- **Farcaster Client API** (`api.farcaster.xyz`): REST API for channels, followers, user data, starter packs, discover actions. No API key for read.
- **Hub API (Snapchain)**: Lower-level message API for casts, reactions, links, user data, verifications. Public hubs include Pinata and Standard Crypto.

### Node / API providers

| Provider          | Type            | Auth        | Base URL                              | Notes                                      |
|------------------|-----------------|------------|----------------------------------------|--------------------------------------------|
| **Neynar**       | Managed API     | `x-api-key`| `https://api.neynar.com` (v2), `https://snapchain-api.neynar.com` | v1 deprecated 2025-03-31; use v2. Covers feeds, users, casts, social graph. |
| **Pinata**       | Hub + Farcaster | Optional   | `https://hub.pinata.cloud`, Farcaster API | Public hub (primary), FDK, Frame Analytics. |
| **Farcaster Client** | Official REST | None (read)| `https://api.farcaster.xyz`           | Channels, followers, discover actions.     |
| **Standard Crypto** | Public hub   | None       | `https://hub.farcaster.standardcrypto.vc:2281` | Fallback hub.                             |

**Hypersnap**: Not found as a standalone provider; may be a product name or Snapchain-related service. Use Neynar or Pinata for managed APIs.

### Data model (Hub / Neynar)

- **FID**: Farcaster ID (numeric).
- **Cast**: ` CastAdd` message with `text`, `mentions`, `embeds`, `parentCastId`, `parentUrl`.
- **UserData**: PFP, display name, bio, URL, etc.
- **Channel**: Topic/community; users follow channels.
- **Reaction**: Like, recast.

## Scope

### TanStack DB collections

- `FarcasterUsers` — users (FID, username, display, pfp, verified address).
- `FarcasterCasts` — casts (hash, fid, text, parent, timestamp).
- `FarcasterChannels` — channels (id, name, followerCount).
- `FarcasterFeeds` — feed items (cast refs, optionally denormalized for a feed type).

Data source: `DataSource.Farcaster` for Neynar/Pinata; add to `data-sources.ts`.

### API module

`src/api/farcaster.ts`:
- Prefer **Farcaster Client API** for channels, discover (no key).
- Optional **Neynar v2** for feeds, user profile, casts when `NEYNAR_API_KEY` is set.
- Normalize responses into schema types before collection upsert.

### Entity types

- `EntityType.FarcasterUser` — `$id: { fid: number }`
- `EntityType.FarcasterCast` — `$id: { fid: number; hash: \`0x${string}\` }`
- `EntityType.FarcasterChannel` — `$id: { id: string }`

Add to `$EntityType.ts`, `entityTypes`, `Entity`, `EntityId`, `graphSceneEntityTypes`.

### Routes

- `/farcaster` — feed overview: channels list, recent casts (tree or list).
- `/farcaster/channel/[channelId]` — channel feed with casts.
- `/farcaster/user/[fid]` — user profile + casts (`EntityView`).
- `/farcaster/cast/[fid]/[hash]` — single cast + replies (`EntityView`, `TreeNode` for reply thread).

### Components

- Use `<EntityView>` for User, Cast, Channel pages.
- Use `<TreeNode>` for reply threads (cast → replies → nested replies).
- Use `<EntityList>` (or equivalent) for feed/channel list of casts.
- Add `deriveWatchedEntityRow` support for `FarcasterUser`, `FarcasterCast`, `FarcasterChannel` in `navigationItems.svelte.ts` when watched.

### Sync / fetch

- Per spec 065: all Farcaster fetches write into collections; UI reads only via `useLiveQuery`.
- Query collections or explicit fetch + upsert. Normalization at collection boundary.
- `getKey` for users: `fid:${fid}`; casts: `fid:${fid}:${hash}`; channels: `channel:${id}`.

## Implementation

### 1. Data sources

- Add `Farcaster` to `DataSource` enum.

### 2. Schema / data types

- `src/data/FarcasterUser.ts`
- `src/data/FarcasterCast.ts`
- `src/data/FarcasterChannel.ts`

### 3. Collections

- `src/collections/FarcasterUsers.ts`
- `src/collections/FarcasterCasts.ts`
- `src/collections/FarcasterChannels.ts`
- Add `CollectionId` entries; register in db init if needed.

### 4. API

- `src/api/farcaster.ts`: `getChannels`, `getChannelFollowers`, `getCastsByParent` (Hub), optional Neynar feed helpers.

### 5. Entity types

- Extend `EntityType`, `Entity`, `EntityId`, `entityTypes`, `graphSceneEntityTypes`.

### 6. Routes

- `/farcaster/+page.svelte`, `/farcaster/+page.ts`
- `/farcaster/channel/[channelId]/+page.svelte`
- `/farcaster/user/[fid]/+page.svelte`
- `/farcaster/cast/[fid]/[hash]/+page.svelte`

### 7. Nav integration

- Add Farcaster section to nav (or under Explore) with link to `/farcaster`.
- `deriveWatchedEntityRow` for FarcasterUser, FarcasterCast, FarcasterChannel.
- When watched Farcaster entities exist, Farcaster nav item expands with Channels link + watched items.

## Non-goals

- Posting/writing casts (read-only initially).
- Farcaster Auth / signer setup.
- Frame actions or frame-specific UI.

## Acceptance criteria

- [x] Spec documents Farcaster protocol state and node providers (Neynar, Pinata, Snapchain).
- [x] `DataSource.Farcaster` exists.
- [x] Schema types `FarcasterUser`, `FarcasterCast`, `FarcasterChannel` with `$id` shapes.
- [x] TanStack DB collections for users, casts, channels; normalization at boundary.
- [x] API module fetches from Farcaster Client API and/or Hub; writes into collections.
- [x] Entity types `FarcasterUser`, `FarcasterCast`, `FarcasterChannel` in `$EntityType.ts`.
- [x] Routes `/farcaster`, `/farcaster/channel/[channelId]`, `/farcaster/user/[fid]`, `/farcaster/cast/[fid]/[hash]`.
- [x] User and Cast pages use `EntityView`; reply thread uses `TreeNode`.
- [x] Feed/channel list uses `EntityList` or equivalent list component.
- [x] All Farcaster data read via `useLiveQuery`; no direct fetch in components.

## Status

Complete.

## Changelog (research implementation)

- **Constants:** `FARCASTER_CLIENT_API_URL`, `FARCASTER_NEYNAR_HUB_URL`; optional Neynar hub when `PUBLIC_NEYNAR_API_KEY` set.
- **API:** `fetchReactionsByCast`, `fetchVerificationsByFid`, `fetchCastsByMention`, `fetchLinksByFid`, `fetchLinksByTargetFid`, `fetchOnChainIdRegistryEventByAddress`; `getHub` tries Neynar first when key present.
- **Schema:** `FarcasterCast` has `likeCount`, `recastCount`; `FarcasterUser` has `verifiedAddress` (populated).
- **UI:** Cast page shows Engagement (likes, recasts); user page shows Verified address, Mentions, Followers, Following; account page shows Farcaster profile link when address has registered FID.
