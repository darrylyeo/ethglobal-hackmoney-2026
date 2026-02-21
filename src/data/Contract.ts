import type { DataSource } from '$/constants/data-sources.ts'
import type { Network$Id } from '$/data/Network.ts'

export type Contract$Id = {
	$network: Network$Id
	address: `0x${string}`
}

/** JSON-serializable ABI (EIP-712 / Solidity ABI format). */
export type ContractAbi = import('@tevm/voltaire/Abi').Abi

export type ContractEntry = {
	$id: Contract$Id
	deployer?: `0x${string}`
	source?: DataSource
	abi?: ContractAbi
}
