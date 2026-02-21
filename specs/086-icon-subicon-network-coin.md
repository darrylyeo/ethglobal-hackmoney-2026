# Spec 086: Icon subicon, backgroundColor, NetworkIcon and CoinIcon

Extend `<Icon>` with optional subicon (recursive icon anchored bottom-right) and
`backgroundColor`; add `<NetworkIcon>` and `<CoinIcon>` that use brand colors
from constants; use them for address avatars, wallet chips, network/coin
inputs and amounts.

## Scope

- **Icon:** Optional `subicon` prop (same shape as Icon: `icon` | `html` | `src`, `alt?`, `size?`, `backgroundColor?`). When set, render a recursive `<Icon>` positioned at bottom-right (e.g. `inset-block-end: 0; inset-inline-end: 0`), default subicon size `40%`. Optional `backgroundColor` prop applied as `--icon-bg` on the root.
- **NetworkIcon:** Component that renders an `<Icon>` with `src` from `networkConfigsByChainId[chainId]?.icon` and `backgroundColor` from `networkConfigsByChainId[chainId]?.color` (`src/constants/networks.ts`). Props: `chainId` (required), optional `class`, `size`, `title`, `alt`, `subicon`. Renders nothing when config has no icon. Default title from config name.
- **CoinIcon:** Component that renders an `<Icon>` with `src` (required) and `backgroundColor` from `coinColorBySymbol[symbol]?.color` (`src/constants/coins.ts`). Props: `src`, `symbol` (required), optional `class`, `size`, `title`, `alt`, `subicon`.
- **Avatar:** Optional `subicon` prop (same shape as Icon subicon); when set, render a small `<Icon>` in a wrapper positioned bottom-right.
- **Usages:** Address avatar uses `<Icon>` with network icon as subicon and subicon `backgroundColor` from `networkConfigsByChainId[chainId]?.color`. Accounts wallet chips use `<Icon>` (wallet icon) with chain icon as subicon and subicon `backgroundColor`. NetworkInput, CoinAmount, CoinName, CoinInput, AccountsSelect use `<NetworkIcon>` and/or `<CoinIcon>` where a network or coin icon is shown (replacing raw `<Icon src={...}>` with config/color-aware components).

## Definitions

- **Subicon:** A second, smaller icon drawn on top of the main icon, anchored at the bottom-right corner (e.g. chain badge on avatar, network badge on wallet icon).
- **Brand colors:** network color via `networkConfigsByChainId[chainId]?.color` in `src/constants/networks.ts`; coin color via `coinColorBySymbol[symbol]?.color` in `src/constants/coins.ts` (hex per chain ID and per coin symbol).
- **Icon size:** Icon, CoinIcon, and NetworkIcon default to `1em`. Do not set `size` at call sites. **Exceptions:** GraphScene (graph node/edge `size` is layout, not UI icon); Avatar subicon (`subicon.size ?? '50%'` is relative to avatar); Avatar component itself (`size` is the avatar container, default `2rem`); Spinner (separate component).

## Implementation

- `src/components/Icon.svelte`: Add `backgroundColor?: string` and `subicon?: SubiconProps`; export `SubiconProps` type; when `subicon` is set, render `<Icon class="icon-subicon" {...subicon} size={subicon.size ?? '40%'} backgroundColor={subicon.backgroundColor} />` in an absolutely positioned wrapper; apply `--icon-bg` when `backgroundColor` is set.
- `src/components/NetworkIcon.svelte`: New component; derive `src` and `backgroundColor` from `networkConfigsByChainId` (config.icon, config.color); render `<Icon>` only when `src` exists; pass optional `subicon` to Icon.
- `src/components/CoinIcon.svelte`: New component; derive `backgroundColor` from `coinColorBySymbol[symbol]?.color` (try `symbol?.toUpperCase()` then `symbol`); render `<Icon src={src} ... backgroundColor={backgroundColor} />`.
- `src/components/Avatar.svelte`: Add optional `subicon` prop; when set, render `<Icon>` in a span with `position: absolute; inset-block-end: 0; inset-inline-end: 0` (size default `40%`).
- **Address:** Pass `subicon={ networkIcon && network != null ? { src: networkIcon, alt: '', backgroundColor: networkConfigsByChainId[network]?.color } : undefined }` to the avatar `<Icon>`.
- **Accounts (wallets):** Pass `subicon={ chainIcon ? { src: chainIcon, alt: '', backgroundColor: networkConfigsByChainId[chainId]?.color } : undefined }` to the wallet `<Icon>` in the connected-chip list.
- **NetworkInput:** Use `<NetworkIcon chainId={network.id} size={16} title={...} />` instead of `<Icon src={icon}>` in selected and item snippets.
- **CoinAmount / CoinName:** Both take `coin` prop; always show icon and symbol. Use `<CoinIcon src={coin.icon.original.url} symbol={coin.symbol} subicon={networkSubicon} ... />` (network from `networkConfigsByChainId[coin.chainId]` as subicon) when coin has icon; else `<NetworkIcon chainId={coin.chainId} size={10} />`. Optional `showName` (boolean) to show full name e.g. "SYMBOL (Name)". Use `coin={...}` consistently at call sites.
- **CoinInput:** Use `<CoinIcon src={iconUrl} symbol={coin.symbol} ... />` in selected and Item snippets.
- **AccountsSelect:** Use `<NetworkIcon chainId={...} size={16} ... />` for wallet chip header and for dropdown items of kind `network`; remove `networkIconSrc` @const where no longer needed.

## Acceptance criteria

- [x] `<Icon>` accepts optional `subicon` (SubiconProps) and renders a recursive Icon anchored bottom-right with optional subicon `backgroundColor`.
- [x] `<Icon>` accepts optional `backgroundColor` and applies it as `--icon-bg`.
- [x] `<NetworkIcon chainId={...} ... />` exists; uses `networkConfigsByChainId` (icon, color); renders nothing when config has no icon.
- [x] `<CoinIcon src={...} symbol={...} ... />` exists; uses `coinColorBySymbol[symbol]?.color` for background.
- [x] `<Avatar>` accepts optional `subicon` and renders Icon bottom-right when set.
- [x] Address avatar Icon receives network subicon with `backgroundColor` when `network` is set.
- [x] Accounts wallet chip Icon receives chain subicon with `backgroundColor`.
- [x] NetworkInput, CoinAmount, CoinName, CoinInput, AccountsSelect use NetworkIcon and/or CoinIcon where appropriate; CoinAmount and CoinName show network as subicon on CoinIcon.

## References

- Spec 001 (constants): `networkConfigsByChainId`, networks.
- Spec 052 (icon procurement): asset URLs and network/coin config icons.
- Spec 068 (EvmActor/Address): Address uses Icon for avatar; avatar now has optional network subicon with color.

## Status

Complete. Icon has subicon + backgroundColor; NetworkIcon and CoinIcon in `src/views/`; Avatar has subicon; Address, Accounts, NetworkInput, CoinAmount, CoinName, CoinInput, AccountsSelect updated. CoinAmount and CoinName always show icon and symbol, network as subicon; `showName` prop; `coin` prop used consistently.
