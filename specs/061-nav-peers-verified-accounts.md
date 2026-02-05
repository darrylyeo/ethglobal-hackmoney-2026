# Spec 061: Nav Peers (verified accounts) under Multiplayer

Show verified accounts in the nav under **Multiplayer > Peers**, with connection and
verification status as tags. Persist peer information and allow forgetting
(delete from local DB) disconnected peers. Clicking a peer/account navigates to
the account page.

**Depends on:** Spec 031 (PartyKit rooms, shared addresses, verifications). Uses
`verificationsCollection` (spec 031) and `roomPeersCollection`; assumes verified
addresses are keyed by verifier (me) and verified peer.

## Scope

- Add **Peers** under Multiplayer in the nav, listing verified accounts (addresses
  the current user has verified in a room).
- Each entry shows the verified account (peer’s address) with:
  - **Connection status** tag (e.g. Connected / Disconnected), derived from
    `roomPeersCollection.isConnected`.
  - **Verification status** tag (e.g. Verified; optional Verifying / Unverifiable
    if still in progress).
- **Persist peer information:** keep room-peer rows for peers we have verified,
  even after they or we leave the room (do not delete them on room sync); update
  `isConnected` from server when in that room.
- **Forget:** allow the user to remove a disconnected peer from the local DB
  (delete their `roomPeersCollection` row(s)); only offer Forget when
  `isConnected === false`.
- **Click:** navigating a peer/account goes to `/account/[address]` (spec 059).

## Non-goals

- Changing verification flow or SIWE (spec 031).
- Adding a separate “known peers” collection; reuse `roomPeersCollection` with
  persisted rows for verified peers.

## Data and persistence

### Verified accounts list

Derive the list from:

1. **Verifications** – rows where current user is the verifier
   (`verifierPeerId === myPeerId`) and `status === 'verified'`, giving
   `address` and `verifiedPeerId`.
2. **Room peers** – join on `roomPeersCollection` where `peerId === verifiedPeerId`
   to get `displayName`, `isConnected`, `lastSeenAt`.

**Identifying "my" verifications:** PartyKit `peerId` is connection-scoped. To
show "verified by me" when not in a room, persist "my" peer id(s) when joining
rooms (e.g. append `roomState.peerId` to a small stored set or collection keyed
by room id). Then "verified by me" = `verifierPeerId` in that set.

Only show entries for which a room-peer row exists (so we have display name and
connection status). After “Forget”, the peer row is removed so that entry
disappears from the list until we see them again in a room.

### Persisting peer information

- **Room sync (spec 031):** when applying sync, do **not** delete
  `roomPeersCollection` rows for peers that appear in `verificationsCollection`
  as “verified by me” (i.e. `verifierPeerId === myPeerId` and
  `verifiedPeerId === peer.peerId`). For all other peers in the synced room,
  keep current behaviour (e.g. delete if not in sync).
- When a peer disconnects or we leave the room, their `roomPeersCollection` row
  stays; `isConnected` is updated from server messages (or set false when we
  leave). So peer info (displayName, peerId, roomId) persists across sessions.

### Forget

- **Forget** = delete from local DB the `roomPeersCollection` row(s) for that
  peer (`peerId`).
- Allowed only when the peer is **disconnected** (`isConnected === false`).
- After forget, that peer’s verified addresses no longer have a matching
  room-peer, so they drop out of the Peers list (until we meet them again and
  have peer + verification data).

## UI

### Nav: Multiplayer > Peers

- Under **Multiplayer**, add a sibling to “Rooms” and “Yellow Channels”:
  - **Peers** – `href`: `/peers` (or a dedicated route for the list).
  - **Children:** one nav item per verified account (with persisted peer info):
    - `title`: peer `displayName` or short address/label.
    - `href`: `/account/[address]` (normalize address per spec 059).
    - Optional tag: connection status (e.g. “Connected” / “Disconnected”) or
      verification badge.
- Only include peers that still have a row in `roomPeersCollection` (so the list
  shrinks after “Forget”).

### Page: Peers list (e.g. `/peers`)

A page that shows the same verified accounts with more detail and actions:

- **List:** each row = one verified account:
  - Peer display name (or fallback).
  - Address (link to `/account/[address]`).
  - **Connection status** tag (e.g. “Connected”, “Disconnected”).
  - **Verification status** tag (e.g. “Verified”, optionally “Verifying” /
    “Unverifiable”).
- **Forget:** per row, show a “Forget” (or “Remove”) control only when
  `isConnected === false`; on confirm, delete that peer’s `roomPeersCollection`
  row(s) from the local DB.
- Clicking the row or address navigates to `/account/[address]`.

### Route and address normalization

- Use the same address normalization as spec 059 for `/account/[address]`
  (interop or raw `0x`).
- Nav and list both link to `/account/[address]` with the canonical form used by
  the app.

## Acceptance criteria

- [x] **Nav:** Multiplayer has a “Peers” item; its children are verified
  accounts (with persisted peer info), each linking to `/account/[address]`.
- [x] **Tags:** Each entry shows connection status (Connected / Disconnected) and
  verification status (e.g. Verified) as tags or badges.
- [x] **Persistence:** Room sync does not delete `roomPeersCollection` rows for
  peers that have at least one verification by the current user (me as verifier).
- [x] **Forget:** User can forget a peer (delete their room-peer row(s) from
  local DB) only when that peer is disconnected; after forget, they disappear
  from the Peers list until seen again.
- [x] **Click:** Clicking a peer/account in the nav or on the Peers page
  navigates to `/account/[address]`.
- [x] **Route:** A Peers list page exists (e.g. `/peers`) with the list, tags,
  and Forget action for disconnected peers.

## Status

Complete. 2026-02-05 (PROMPT_build): myPeerIdsCollection in src/collections/my-peer-ids.ts (persist peerId per room on join). room.svelte.ts: joinRoom upserts my peer id; syncStateToCollections skips deleting roomPeersCollection rows for verified-by-me peers; forgetPeer(peerId) deletes all room-peer rows for that peer. Layout: verificationsQuery, roomPeersQuery, myPeerIdsQuery; derived peersNavItems (verified by me + has room peer), Peers under Multiplayer with children and tag count. Route /peers: +page.svelte with list, connection/Verified tags, Forget when disconnected (confirm), link to /account/[address]. E2e coverage manifest: /peers default branch. test:unit 41 Deno + 101 Vitest passed. verifications collection and “verified by me” query (spec

## Output when complete

`DONE`
