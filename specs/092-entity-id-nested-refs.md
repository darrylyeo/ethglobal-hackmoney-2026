# Spec 092: Entity IDs – $id object and nested references

All entity type definitions store their identifying fields under a single object field `$id`, typed as `[EntityName]$Id`. Entities that reference other entities nest those references inside `$id` (e.g. `$network: Network$Id`, `$actor: Actor$Id`). See blockhead.vision-portfolio schema (e.g. `EvmBlock`, `EvmTransaction`, `EvmActor_EvmNetwork`, `EvmActor_Coin`) for the pattern.

## Conventions

1. **Every entity row has `$id: [EntityName]$Id`** – an object, not a primitive. The type name is the entity name plus the suffix `$Id`.
2. **Root entities** (no parent entity): their `$Id` contains only primitive or domain fields (e.g. `Network$Id = { chainId }`, `EvmActor` in vision-portfolio has `$id: { address }`).
3. **Entities that reference other entities**: their `$Id` nests the referenced entity’s id under a named key, e.g. `$network: Network$Id`, `$actor: Actor$Id`, `$block: Block$Id`. No duplicated primitives that already exist on the referenced id (e.g. do not put `chainId` at top level if it’s inside `$network.chainId`).

## Canonical shapes (this repo)

| Entity | Current / legacy | Target `[Name]$Id` |
|--------|-------------------|---------------------|
| Network | `$id: ChainId` | `Network$Id = { chainId: ChainId }` |
| Actor | `$id: { network, address, interopAddress? }` | `Actor$Id = { $network: Network$Id, address, interopAddress? }`; remove duplicate `chainId`/`address` from Actor |
| Contract | `$id: { chainId, address }` | `Contract$Id = { $network: Network$Id, address }` |
| Block | `$id: { chainId, blockNumber }` | `Block$Id = { $network: Network$Id, blockNumber, hash? }` (optional hash for alternate lookup, cf. vision-portfolio EvmBlock number \| hash) |
| Coin | `$id: { network, address, interopAddress? }` | `Coin$Id = { $network: Network$Id, address, interopAddress? }` |
| ActorCoin | `$id: { chainId, address, tokenAddress, interopAddress? }` | `ActorCoin$Id = { $actor: Actor$Id, $coin: Coin$Id }` |
| ChainTransaction | `$id: { chainId, txHash }` | `ChainTransaction$Id = { $network: Network$Id, txHash }` |
| TransactionTrace | `$id: { chainId, txHash }` | `TransactionTrace$Id = { $network: Network$Id, txHash }` |
| VerifiedContractSource | `$id: { chainId, address }` | `VerifiedContractSource$Id = { $network: Network$Id, address }` |
| TokenListCoin | `$id: { chainId, address, interopAddress? }` | `TokenListCoin$Id = { $network: Network$Id, address, interopAddress? }`; remove top-level chainId/address from type |
| ActorAllowance | `$id: { chainId, address, tokenAddress, spenderAddress }` | `ActorAllowance$Id = { $actorCoin: ActorCoin$Id, $spender: Actor$Id, interopAddress? }` (composite refs, cf. vision-portfolio EvmActor_Erc20Token_EvmContract) |
| EvmActorProfile | `$id: { chainId, address }` | `EvmActorProfile$Id = { $network: Network$Id, address }` |
| TransferEvent | `$id: { symbol, period, chainId, blockNumber, logIndex }` | `TransferEvent$Id = { $network: Network$Id, symbol, period, blockNumber, logIndex }` |
| EnsAvatar | row = id & fields (chainId, address) | `EnsAvatar$Id = { $network: Network$Id, address }`; `EnsAvatarRow = { $id: EnsAvatar$Id, avatarUrl?, primaryName? }` |
| StorkPrice | `$id: { assetId, transport, chainId? }` | `StorkPrice$Id = { assetId, transport, $network? }`; remove top-level `chainId` from type |

Access at call sites: e.g. `contract.$id.$network.chainId`, `block.$id.$network.chainId`, `block.$id.blockNumber`. Collections’ `getKey` and query `where` clauses use the same nested paths.

## Out of scope (this spec)

- Bridge `Transaction` ($id by sourceTxHash/address/createdAt) and other entities that are not network/block/contract/actor/coin refs.
- Changing runtime storage format of existing collections (migration); type and API only.

## Status

Complete. Re-verification 2026-02-21 (PROMPT_build execute one spec): All conventions confirmed—Network$Id = { chainId }; Actor, Block, Contract, Coin, ActorCoin, ChainTransaction, TransactionTrace, VerifiedContractSource, TokenListCoin, ActorAllowance, EvmActorProfile, TransferEvent, EnsAvatar, StorkPrice use nested `$id` ($network, $actor, $coin, etc.); GraphScene uses `row.$id.chainId` for Network and `row.$id.$network.chainId` for other entities; collections getKey/where use nested paths. Deno test 55 passed; Vitest phase pre-existing failure (npm:@tanstack/svelte-db). Previous: Implemented. Network, Actor, Contract, Block, Coin, ActorCoin, ChainTransaction, TransactionTrace, VerifiedContractSource, TokenListCoin, ActorAllowance, EvmActorProfile, TransferEvent, EnsAvatar, StorkPrice use nested `$id`; GraphScene Network node id uses `row.$id.chainId`; collections and call sites updated.
