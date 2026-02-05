# Spec 057: Yellow channels management route

Provide a dedicated, room-agnostic management route for all Yellow payment
channels so users can monitor and act on channels regardless of where they were
created (room flow, direct Nitro RPC, or restored from clearnode state sync).

**Depends on:**

- Spec 031: PartyKit multiplayer rooms
- Spec 032: Yellow state channels

## Overview

The current room UI only surfaces channels that involve verified room peers.
This spec adds a global Yellow channels route that lists every channel in
`yellowChannelsCollection`, with filtering, status, and management actions.
Room-created channels must appear here immediately and link back to their room
context.

## Scope

- New route: `/channels/yellow` for global channel management.
- A global list that includes all channels in `yellowChannelsCollection`.
- Clear indicators for channel origin (room vs. non-room).
- Quick navigation from a channel to its room (when `roomId` is present).
- Integration with room channel creation so room-based channels are tagged and
  visible globally without delay.

## Non-goals

- No new Yellow protocol features or Nitro RPC endpoints.
- No changes to channel settlement semantics.
- No additional room permission model beyond existing verified-address gating.

## Route and UI

### `src/routes/channels/yellow/+page.svelte`

- Render a summary section:
  - total channels
  - active channels
  - channels with a `roomId`
- Render a list/table of channels with:
  - channel id (shortened)
  - participants (participant0/participant1)
  - my balance + counterparty balance
  - status
  - room badge (room name / room id) when present
  - primary actions:
    - `Send` (only when channel is active and user is a participant)
    - `Close` (cooperative close)
    - `Challenge` (dispute)
  - `View room` link when `roomId` exists (points to `/rooms/:roomId/channels`)

### Filters

- Status filter: `all | active | closing | dispute | final | initial`
- Origin filter: `all | room | external`
- Participant filter: show only channels where the current address is
  `participant0` or `participant1` (default on; toggleable)

## Data handling

### Channel origin tagging

- Ensure `roomId` is attached when a channel is created via room flow:
  - `openChannel` accepts an optional `roomId` parameter.
  - The room UI passes the current `roomId` when opening channels.
- Channels that are synced from clearnode without a room context retain
  `roomId: undefined`.

### Navigation integration

- Add a navigation item titled `Yellow Channels` pointing to `/channels/yellow` (under Multiplayer group in nav).
- Room channel creation flows provide a direct link (or secondary CTA) to
  `/channels/yellow` after successful creation.

## Acceptance criteria

- [x] Route `/channels/yellow` exists and renders without requiring a room.
- [x] All entries in `yellowChannelsCollection` are listed on the route,
      regardless of origin.
- [x] Status, balances, and participant info are visible per channel.
- [x] Room-associated channels render a room badge and `View room` link.
- [x] Filters exist for status, origin, and “my channels only”.
- [x] Room-created channels are tagged with `roomId` and appear in the global
      list immediately after creation.
- [x] Navigation includes `Yellow Channels` linking to `/channels/yellow`.

## Status

Complete. Route `src/routes/channels/yellow/+page.svelte`: summary (total, active, with room), table with channel id, participants, balances, status, room badge, View room link, Send/Close/Challenge actions; filters status (all|initial|active|closing|dispute|final), origin (all|room|external), my channels only. Uses `yellowChannelsCollection`, `yellowChannelStatesCollection`, `roomsCollection`; wallet provider from connections for Challenge. `tagChannelWithRoom` and optional `roomId` on `openChannel` in `src/state/yellow.svelte.ts` and `src/api/yellow.ts` for room-origin tagging. Nav item in `+layout.svelte` under Multiplayer (with Rooms); link from room channels page. E2E coverage scenario in `e2e/coverage-manifest.ts`. Fixed pre-existing build error in `src/state/intent-navigation.svelte.ts` (export state mutation).

## Output when complete

`DONE`
