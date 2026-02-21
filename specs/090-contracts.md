# Spec 090: Contracts

Contracts collection, routes, entity view, and ContractAction for ABI-driven
read/write interaction. Uses Voltaire for RPC/ABI, Tevm for simulation.

## Scope

- TanStack DB `Contracts` collection
- Entity type `Contract` with `<Contract>` view (uses `<EntityView>`)
- Network contract route: `/network/[name]/contract/[address]`
- Network contracts list route: `/network/[name]/contracts`
- Account page Contracts module: deployed-contract discovery across networks
- `<ContractAction>`: interactive UI for readable/writable methods from ABI
  - Read-only (view/pure): Simulate (Tevm) + Query (real `eth_call`)
  - State-changing (nonpayable/payable): Simulate (Tevm) + Sign & Broadcast
- Layout similar to session `<Action>` (Params | Proposed Transaction), no Protocol column

## Non-goals

- Full contract verification UI (Sourcify integration for source only; ABI from verification metadata)
- Custom contract indexing beyond "deployed by address" discovery

## Data model

### ContractEntry (`src/data/Contract.ts`)

- `$id: { chainId, address }` — unique per chain + address
- `deployer?: \`0x${string}\`` — creator address
- `source?: 'Sourcify'` — verification source
- `abi?: Abi` — from Sourcify or user-paste

### Contracts collection (`src/collections/Contracts.ts`)

- localStorage-backed, same pattern as `VerifiedContractSources`
- `ensureContract(chainId, address)`: upsert; fetches ABI from Sourcify when verified
- `fetchContract(chainId, address)`: fetch and insert/update

## Routes

### `/network/[name]/contract/[address]`

- Resolve network from `[name]`, validate `[address]` as EVM address
- Ensure contract (Sourcify for ABI when verified)
- Render `<EntityView entityType={EntityType.Contract}>` with `<Contract>` (metadata, verified source, ContractAction)

### `/network/[name]/contracts`

- List or browse contracts on the network
- MVP: placeholder with "browse by address" or link to add contract

## Contract view

`<Contract>` (`src/views/Contract.svelte`):

- Uses `<EntityView>` with `entityType={EntityType.Contract}`
- Metadata: chainId, network name, address
- Children: verified source (if any), `<ContractAction>`

## ContractAction component

`<ContractAction>` (`src/views/ContractAction.svelte`):

**Props:** `chainId`, `address`, `abi`, optional `contractName`, optional `from` for write txs

**Layout:** Single-column `data-column` or `data-grid`:
- Params section: method selector, input fields
- Proposed Transaction / Result section: Simulate, Query (read) or Sign & Broadcast (write)

**Method categorization:**
- Variables: read-only, no inputs (view/pure)
- Queries: read-only, with inputs
- Actions: state-changing (nonpayable/payable)

Use `isReadable`, `isWritable`, `isReadableWithoutInputs` pattern for ABI function filtering.

**Read-only actions:**
- Simulate: Tevm via `runTevmSimulationFromClient`; display decoded result
- Query: real `eth_call` via Voltaire; decode with `decodeParameters`

**Write actions:**
- Simulate: same Tevm flow as session Action
- Sign & Broadcast: wallet `eth_sendTransaction`

**Input rendering:** AddressInput for `address`, BigNumberInput for int/uint, text for others

**Encoding:** `encodeFunction` from `@tevm/voltaire/Abi`

## Account page Contracts module

- Add `<Boundary><AccountContracts /></Boundary>` to account page
- `AccountContracts`: queries contracts deployed by account address across supported networks
- Discovery: Blockscout/Etherscan-style API per chain (contract creations from tx receipts)
- Insert discovered contracts into `Contracts` collection
- Render list linking to `/network/[slug]/contract/[address]`
- Show when at least one contract exists, or always with "No contracts" when empty

## API additions

### Voltaire (`src/api/voltaire.ts`)

- `ethCall(provider, { to, data, from?, value?, blockTag? })` — generic `eth_call` helper

### Sourcify (`src/api/sourcify.ts`)

- Extend `fetchVerifiedContract` to return `abi` when Sourcify provides it (metadata structure)

## Acceptance criteria

- [x] `Contract` data type in `src/data/Contract.ts` with `$id`, optional `deployer`, `source`, `abi`
- [x] `CollectionId.Contracts` in `src/constants/collections.ts`
- [x] `contractsCollection` in `src/collections/Contracts.ts` with `ensureContract`, `fetchContract`
- [x] `EntityType.Contract` in `src/data/$EntityType.ts` and `entityTypes`
- [x] `<Contract>` view in `src/views/Contract.svelte` using `<EntityView>`
- [x] `ethCall` in `src/api/voltaire.ts` for generic reads
- [x] Sourcify `fetchVerifiedContract` returns `abi` when available
- [x] `<ContractAction>` in `src/views/ContractAction.svelte` with method selector, inputs, Simulate/Query (read), Simulate/Sign & Broadcast (write)
- [x] Route `/network/[name]/contract/[address]` renders Contract view
- [x] Route `/network/[name]/contracts` exists (list or placeholder)
- [x] Account page has AccountContracts module with discovery and links to contract pages
- [x] Nav includes Contracts under network

## Status

Complete. All criteria verified: Contract.ts, CollectionId.Contracts, contractsCollection (ensureContract, fetchContract with Sourcify → Etherscan → Blockscout per Spec 110), EntityType.Contract, Contract.svelte, ethCall in voltaire.ts, Sourcify fetchContractWithAbi/fetchContractFull return abi, ContractAction.svelte, routes network/[name]/contract/[address] and contracts, AccountContracts, nav Contracts under network.
