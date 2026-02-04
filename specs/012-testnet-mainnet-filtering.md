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

### `src/state/bridge-settings.svelte.ts`

Bridge settings including `isTestnet` are managed via `bridgeSettingsState` with
localStorage persistence.

### `src/routes/bridge/lifi/BridgeFlow.svelte`

```svelte
// Networks (derived from settings)
const filteredNetworks = $derived(
  networks.filter((n) => settings.isTestnet ? n.type === NetworkType.Testnet : n.type === NetworkType.Mainnet)
)

// Initialize networks when switching testnet/mainnet
$effect(() => {
  if (filteredNetworks.length === 0) return
  if (settings.fromChainId !== null && filteredNetworks.some((n) => n.id === settings.fromChainId)) return
  const defaultFrom = settings.isTestnet ? ChainId.EthereumSepolia : ChainId.Ethereum
  const defaultTo = settings.isTestnet ? ChainId.ArcTestnet : ChainId.Optimism
  bridgeSettingsState.current = {
    ...settings,
    fromChainId: filteredNetworks.find((n) => n.id === defaultFrom)?.id ?? filteredNetworks[0]?.id ?? null,
    toChainId: filteredNetworks.find((n) => n.id === defaultTo)?.id ?? filteredNetworks[1]?.id ?? null,
  }
})
```

### Reset chain selection on toggle

When testnet/mainnet changes, the `$effect` resets fromChainId/toChainId to
appropriate defaults for the new network type.

## Acceptance criteria

- [x] Mainnet mode shows only mainnet chains in dropdowns
- [x] Testnet mode shows only testnet chains in dropdowns
- [x] Balances grid shows only chains matching toggle
- [x] Chain selection resets if current chain not in filtered list
- [x] Toggle preference persists across page reloads
- [x] Default to Mainnet if no preference stored

## Status

Complete. Testnet/mainnet toggle managed via `bridgeSettingsState` (persisted).
BridgeFlow.svelte: `filteredNetworks` derived from `settings.isTestnet` and
`NetworkType`, `$effect` resets fromChainId/toChainId when not in filtered list.
Routes and balances refetch when filter changes.

## Output when complete

`DONE`
