# Spec 069: Nav item icons / emojis

Add a relevant icon or emoji to every sidebar nav item so each entry has a
consistent visual cue. Uses the existing `NavigationItem.icon` and
`NavigationItem.svelte` Icon rendering (`icon` string or `data:` `src`).

## Scope

- **Source:** `navigationItems` in `src/routes/+layout.svelte` (and any
  derived children: account items, sessions, agents, explore networks/coins,
  multiplayer rooms/peers, test routes).
- **Format:** Prefer single emoji (or short emoji sequence) per item for
  consistency and no extra assets. Icon component already renders `icon` as
  text; `data:` URLs are supported via `navIconProps` for wallet/account
  icons.
- **Coverage:** Every nav item (top-level and nested) must have an `icon`
  value. Dynamic children (accounts, sessions, rooms, peers, networks, etc.)
  get either a shared type icon or, where already defined (e.g. wallet icon for
  accounts), keep existing behavior.

## Icon mapping (canonical)

Assign one icon per nav item id/title. Implementation chooses exact character;
below is the intended mapping.

| Item (id or title)   | Icon (example) |
|----------------------|----------------|
| Dashboard            | 📊 |
| Accounts             | 👥 |
| Actions              | ⚡ |
| Transfer             | 💸 |
| Swap                 | 🔄 |
| Bridge               | 🌉 |
| Add Liquidity        | 💧 |
| Sessions             | 📋 |
| Agents               | 🤖 |
| New conversation     | ➕ or ✨ |
| Explore              | 🔍 |
| Coins                | 🪙 |
| USDC / ETH (coins)   | use coin asset or 💵 / ⟠ |
| Networks             | 🌐 |
| Multiplayer          | 👥 or 🎮 |
| Rooms                | 🏠 |
| Peers                | 🤝 |
| Yellow Channels      | 💛 or ⚡ |
| Tests                | 🧪 |
| Networks & coins (test) | 🔗 |
| Chain ID (test)      | #️⃣ |
| Intents (test)       | 📌 |

Account items: keep `wallet.icon` when present; otherwise fallback emoji (e.g.
👤). Session/room/peer items: one shared icon per type (e.g. 📋 for sessions,
🏠 for rooms, 🤝 for peers). Network items: chain icon from config when
available, else 🌐.

## Implementation

- In `+layout.svelte`, add `icon` to every entry in `navigationItems` and to
  every derived child array (sessions, pinned agents, explore coins/networks,
  multiplayer rooms/peers, test links). Use the mapping above; for dynamic
  items use the same icon as their parent section or the type-specific icon
  listed.
- Ensure account nav items continue to use `wallet.icon ?? fallback` (e.g. 👤).
- No change to `NavigationItem.svelte` or `Icon.svelte` required; they already
  support optional `icon` and render it.

## Acceptance criteria

- [x] Every top-level nav item (Dashboard, Accounts, Actions, Sessions,
  Agents, Explore, Multiplayer, Tests) has an `icon` and displays it in the
  sidebar.
- [x] Every nested nav item (Transfer, Swap, Bridge, Add Liquidity; session
  rows; New conversation + pinned agents; Coins, USDC, ETH, Networks + network
  rows; Rooms + room rows, Peers + peer rows, Yellow Channels; test routes)
  has an `icon` and displays it.
- [x] Account items still use wallet icon when available, with a fallback
  emoji when not.
- [x] Icons are visually appropriate (emoji or existing asset) and consistent
  with the mapping above (or documented equivalent).

## Status

Complete. Icons added in `+layout.svelte` for all nav items; account fallback
👤; peersNavItems and network rows use type icons; network rows use
`config.icon ?? '🌐'`. `NavigationItem.svelte` updated so paths (`/icons/...`)
are passed as `src` to Icon for chain SVGs.

## Output when complete

`DONE`
