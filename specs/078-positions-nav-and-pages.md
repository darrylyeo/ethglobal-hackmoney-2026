# Spec 078: Positions nav section, Liquidity and Channels pages, account integration

Add a **Positions** navigation section with children **Liquidity** (Uniswap) and **Channels** (Yellow). Create dedicated pages that query positions for all connected accounts; account pages show the same position data filtered by address.

## Scope

- **Nav:** New section "Positions" with children "Liquidity" and "Channels". Move "Yellow Channels" out of Multiplayer into Positions → Channels.
- **Routes:**
  - `/positions/liquidity` — dedicated page listing Uniswap V4 positions for all actors (from wallet connections).
  - `/positions/channels` — dedicated page for Yellow channels (current `/channels/yellow` content). Canonical route becomes `/positions/channels`; `/channels/yellow` redirects for backward compatibility.
- **Data:** Positions pages and account page query `uniswapPositionsCollection` and `yellowChannelsCollection`. "All actors" = union of all addresses in connected wallet connections (same as Accounts nav). Filter:
  - Uniswap: `row.owner` in actors.
  - Yellow: `row.participant0` or `row.participant1` in actors.
- **Positions Liquidity page:** Trigger `fetchUniswapPositions` for each (chainId, owner) from connected connections so the collection is populated; then list positions owned by any connected actor.
- **Positions Channels page:** Reuse existing Yellow channels UI (table, filters, actions); ensure it uses the same all-actor filtering so it shows channels where any connected account is participant.
- **Account page:** Add live queries for `uniswapPositionsCollection` and `yellowChannelsCollection`. Display sections "Liquidity positions" (owner = account) and "Channels" (participant0/1 = account) when non-empty.

## Non-goals

- No new protocol or API features.
- No change to how Uniswap or Yellow data is synced beyond triggering fetches for all connected (chainId, owner) on the Liquidity page.

## Acceptance criteria

- [x] Nav has section "Positions" with children "Liquidity" (href `/positions/liquidity`) and "Channels" (href `/positions/channels`). "Yellow Channels" is no longer under Multiplayer.
- [x] Route `/positions/liquidity` exists; queries all connected actors and lists Uniswap positions for those owners (and triggers fetch for each (chainId, owner)).
- [x] Route `/positions/channels` exists and shows Yellow channels for all connected actors (participant0/1). Content matches current Yellow channels management (filters, Send/Close/Challenge).
- [x] `/channels/yellow` redirects to `/positions/channels` (302 or SvelteKit redirect).
- [x] Account page `/account/[address]` includes queries for Uniswap positions (owner = address) and Yellow channels (participant0 or participant1 = address).
- [x] Account page displays "Liquidity positions" and "Channels" sections when the account has at least one such position/channel.

## Status

Complete. Re-verification 2026-02-21 (PROMPT_build execute one spec, no INCOMPLETE specs—re-verify 078): All 6 AC confirmed—nav section "Positions" with Liquidity (/positions/liquidity) and Channels (/positions/channels) in navigationItems.svelte.ts; Yellow Channels not under Multiplayer; /positions/liquidity and /positions/channels routes exist; positions/liquidity fetches Uniswap positions for connected actors; positions/channels uses stateChannelsCollection and Yellow UI; /channels/yellow redirects via goto in +page.svelte; account/[address] has LiquidityPositions and Channels with selectedActor; sections shown when non-empty. Deno test 55 passed; Vitest phase pre-existing failure (npm:@tanstack/svelte-db).
