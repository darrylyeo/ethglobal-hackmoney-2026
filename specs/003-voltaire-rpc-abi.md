# Spec 003: Voltaire RPC and ABI handling

Use Voltaire (@tevm/voltaire) for all Ethereum RPC and ABI handling. No ethers or viem.

## Acceptance criteria

- [x] Voltaire is used for at least one RPC call (e.g. chain ID, balance, or contract read) relevant to bridging.
- [x] No imports from `ethers` or `viem` in the codebase for RPC/ABI; Voltaire (or app code using it) is the only provider.
- [x] ABI handling (e.g. encoding/decoding for a USDC or bridge contract) uses Voltaire, not ethers/viem.
- [x] Unit test(s) exist that stub or call Voltaire and assert correct RPC/ABI usage (e.g. call args, return shape).

## Status

Complete.

## Output when complete

` DONE `
