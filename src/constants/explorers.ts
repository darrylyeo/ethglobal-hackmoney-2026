/**
 * Chain-specific block explorer URLs for transaction and address links.
 * Spec 008: Transaction status tracking.
 */

export const explorerUrls: Partial<Record<number, string>> = {
	1: 'https://etherscan.io',
	10: 'https://optimistic.etherscan.io',
	50: 'https://xdc.blocksscan.io',
	51: 'https://apothem.blocksscan.io',
	130: 'https://unichain.blockscout.com',
	1301: 'https://sepolia.unichain.blockscout.com',
	137: 'https://polygonscan.com',
	80002: 'https://amoy.polygonscan.com',
	143: 'https://explorer.monad.xyz',
	10143: 'https://testnet-explorer.monad.xyz',
	146: 'https://sonicscan.org',
	14601: 'https://testnet.sonicscan.org',
	300: 'https://sepolia-era.zksync.network',
	324: 'https://era.zksync.network',
	480: 'https://worldscan.org',
	4801: 'https://sepolia.worldscan.org',
	998: 'https://testnet.hyper.evm.cc',
	999: 'https://hyper.evm.cc',
	1328: 'https://testnet.seitrace.com',
	1329: 'https://seitrace.com',
	42161: 'https://arbiscan.io',
	421614: 'https://sepolia.arbiscan.io',
	42220: 'https://celoscan.io',
	43113: 'https://testnet.snowtrace.io',
	43114: 'https://snowtrace.io',
	8453: 'https://basescan.org',
	84532: 'https://sepolia.basescan.org',
	57073: 'https://explorer.inkonchain.com',
	59141: 'https://sepolia.lineascan.build',
	59144: 'https://lineascan.build',
	763373: 'https://testnet.explorer.inkonchain.com',
	81224: 'https://explorer.codexchain.io',
	812242: 'https://testnet-explorer.codexchain.io',
	98866: 'https://plume-explorer.alt.technology',
	98867: 'https://testnet-plume-explorer.alt.technology',
	11142220: 'https://celo-sepolia.blockscout.com',
	11155111: 'https://sepolia.etherscan.io',
	11155420: 'https://sepolia-optimism.etherscan.io',
	5042002: 'https://testnet.arcscan.io',
}

export const getTxUrl = (chainId: number, txHash: string): string =>
	`${explorerUrls[chainId] ?? 'https://blockscan.com'}/tx/${txHash}`

export const getAddressUrl = (chainId: number, address: string): string =>
	`${explorerUrls[chainId] ?? 'https://blockscan.com'}/address/${address}`
