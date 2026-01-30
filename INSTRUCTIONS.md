Write a minimal interface to drive the LI.FI SDK and USDC bridging across all supported chains
* https://docs.li.fi/introduction/user-flows-and-examples/end-to-end-example
* https://docs.li.fi/introduction/user-flows-and-examples/requesting-route-fetching-quote
* https://docs.li.fi/introduction/user-flows-and-examples/difference-between-quote-and-route
* https://developers.circle.com/bridge-kit


Use:
* TanStack DB collections to fetch and normalize data
* Voltaire (instead of Ethers/Viem) for Ethereum RPC calls and ABI handling
* Bits UI without CSS
* Vitest to ensure the interface is working as expected
* USDC on all its supported chains


Code style:
* Tabs
* No semicolons
* For constants, make a `.ts` file for each entity type abd export TypeScript enums as IDs and associated mapping objects for values
	```typescript
	// networks.ts

	export enum Network {
		Ethereum = 1,
		Base = 8453,
	}

	export const networks = {
		[Network.Ethereum]: {
			name: 'Ethereum',
		},
		[Network.Base]: {
			name: 'Base',
		},
	}
	```
