# Spec 087: Global network environment (mainnet/testnet) – profile spec extension

Builds on [085-profiles.md](./085-profiles.md). Adds a **global** network environment
toggle (mainnet vs testnet) and gives network-specific profile collections
separate storage prefixes per environment so each profile has distinct data per
mode.

## Enum and global setting

```typescript
enum NetworkEnvironment {
	Mainnet = 'mainnet',
	Testnet = 'testnet',
}
```

- The app has a single **global** setting: current network environment
  (mainnet or testnet). Not per-profile; one value for the whole app.
- Stored in localStorage under a dedicated key (e.g.
  `blockhead.v1:network-environment`) and exposed via reactive state so the
  nav toggle and all network-dependent UI stay in sync.
- All chain/network filtering (bridge, session, wallet, etc.) uses this
  global value. No local testnet toggles on individual pages.

## Profile storage: network-environment–scoped keys

Within the existing profile namespacing, some collections are
**network-environment–scoped**: they get an extra segment for
mainnet vs testnet so the same profile can have different data in each mode.

Key formats:

- **Profile-only** (unchanged): `blockhead.v1:<profileId>:<storageKey>`
- **Profile + network environment**: `blockhead.v1:<profileId>:<mainnet|testnet>:<storageKey>`

A constant lists which profile-scoped storage keys use the env prefix, e.g.:

- `wallet-connections`
- `transaction-sessions`
- `BridgeTransactions`
- `SessionSimulations` (and related session keys)

All other profile-scoped keys (e.g. `WatchedEntities`, `Dashboards`,
`AgentChatTrees`, `LlmConnections`, `EntitySources`, `RoomPersistentPeerId`)
remain profile-only (no env segment).

### Profile switch

When switching profile, for **env-scoped** keys use the **current** global
network environment when reading/writing the archive:

- Archive: working copy → `blockhead.v1:<oldProfileId>:<currentEnv>:<key>`
- Restore: `blockhead.v1:<newProfileId>:<currentEnv>:<key>` → working copy

For non–env-scoped keys, behaviour is unchanged (archive/restore
`blockhead.v1:<profileId>:<key>`).

### Network environment switch

When the user changes the global network environment (mainnet ↔ testnet):

1. Archive: working copy → `blockhead.v1:<activeProfileId>:<oldEnv>:<key>` for
   each env-scoped key.
2. Restore: `blockhead.v1:<activeProfileId>:<newEnv>:<key>` → working copy for
   each env-scoped key.
3. Update the global setting.
4. Dispatch synthetic `StorageEvent`s for each env-scoped key so TanStack DB
   re-reads the working copy.

No navigation on env switch.

## UI

### `<NetworkEnvironmentInput>`

- Dedicated component (e.g. `src/views/NetworkEnvironmentInput.svelte`) that:
  - Binds to the global network environment (mainnet/testnet).
  - Renders a control (e.g. Switch + label) consistent with the existing
    mainnet/testnet toggle (e.g. in AccountsSelect): “Mainnet” / “Testnet”.
- Used in one place only: **navigation footer**, to the **right** of the
  profile menu (ProfileSwitcher). So footer order: [ProfileSwitcher]
  [NetworkEnvironmentInput].

### Removal of local toggles

- **Session page** (`/session`): remove the local testnet Switch; session
  context and chain filtering use the global network environment.
- **AccountsSelect**: remove the inline mainnet/testnet Switch and label; keep
  only the network selector (e.g. NetworkInput). The list of networks is
  filtered using the **global** network environment (passed in as a prop or
  read from global state).
- **Wallets/Accounts** and any other page that had a local mainnet/testnet
  control: remove it and rely on the global setting.

### *Input components and `networkEnvironment` prop

- Any view that depends on network-specific context and uses a network/chain
  selector (e.g. NetworkInput, NetworksInput, CoinInput where chain matters)
  should receive a `networkEnvironment` prop. The **parent** reads the current
  global setting and passes it down so the child can filter networks/options
  accordingly. The component does not read global state directly; it stays
  testable and single-source-of-truth is the global setting in the layout/parent.

## Acceptance criteria

- [x] `NetworkEnvironment` enum defined (Mainnet, Testnet) and global
  get/set (reactive) for current network environment; persisted to
  `blockhead.v1:network-environment` (or equivalent).
- [x] `NETWORK_ENVIRONMENT_SCOPED_STORAGE_KEYS` constant lists env-scoped
  profile keys; profile switch uses current env when archiving/restoring
  those keys.
- [x] Switching global network environment archives working copy to
  `blockhead.v1:<activeProfileId>:<oldEnv>:<key>`, restores from
  `blockhead.v1:<activeProfileId>:<newEnv>:<key>`, dispatches storage events.
- [x] `<NetworkEnvironmentInput>` component exists and is used only in the
  nav footer to the right of the profile menu.
- [x] Session page has no local testnet toggle; session context uses global
  network environment.
- [x] AccountsSelect has no local mainnet/testnet toggle; filters networks
  by global `networkEnvironmentState.current`.
- [x] All pages that previously had a local network env control use the
  global setting; session actions receive `globalIsTestnet` from context.
- [x] Bridge/session/wallet code uses global network environment;
  `BridgeSettings` no longer contains `isTestnet`; `BridgeSessionParams`
  extends with `isTestnet` (set from global in bridgeDefaults).
