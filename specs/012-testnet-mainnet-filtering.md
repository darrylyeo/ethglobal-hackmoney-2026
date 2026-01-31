# Spec 012: Testnet/Mainnet filtering

The wallet provider has a testnet/mainnet toggle but it doesn't filter chains in the
bridge UI. This spec wires them together.

## Requirements

1. **Filter networks by type:**
   - When "Mainnet" selected: show only mainnet chains
   - When "Testnet" selected: show only testnet chains

2. **Filter balances:**
   - Only fetch/display balances for chains matching the toggle

3. **Persist preference:**
   - Store testnet/mainnet preference in localStorage
   - Restore on page load

## Implementation

### Update `WalletProvider.svelte`

- Load `isTestnet` from localStorage on init
- Save to localStorage when toggled

### Update bridge page

```svelte
const filteredNetworks = $derived(
  networks.filter(n =>
    wallet.isTestnet
      ? n.type === NetworkType.Testnet
      : n.type === NetworkType.Mainnet
  )
)

const filteredNetworkItems = $derived(
  filteredNetworks.map(n => ({ value: String(n.id), label: n.name }))
)

const filteredBalances = $derived(
  actorCoins.filter(ac =>
    filteredNetworks.some(n => n.id === ac.chainId)
  )
)
```

### Reset chain selection on toggle

When testnet/mainnet changes:
- If selected `fromChain` is not in filtered list, reset to first available
- Same for `toChain`

## Acceptance criteria

- [ ] Mainnet mode shows only mainnet chains in dropdowns
- [ ] Testnet mode shows only testnet chains in dropdowns
- [ ] Balances grid shows only chains matching toggle
- [ ] Chain selection resets if current chain not in filtered list
- [ ] Toggle preference persists across page reloads
- [ ] Default to Mainnet if no preference stored

## Status

Not started.

## Output when complete

`DONE`
