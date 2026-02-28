<script lang="ts" generics="Item extends { address: `0x${string}` }">
	// Types/constants
	import type { Network$Id } from '$/data/Network.ts'
	import { IdentityInputKind } from '$/constants/identity-resolver.ts'
	import { PatternType } from '$/constants/patterns.ts'


	// Props
	let {
		items,
		value = $bindable(null as `0x${string}` | null),
		placeholder = 'Select address',
		disabled,
		name,
		id,
		ariaLabel = 'Address',
		network = { chainId: 1 } as Network$Id,
		getItemId = (item: Item) => item.address,
		getItemLabel = (item: Item) => item.address,
		...rootProps
	}: {
		items: readonly Item[]
		value?: `0x${string}` | null
		placeholder?: string
		disabled?: boolean
		name?: string
		id?: string
		ariaLabel?: string
		network?: Network$Id
		getItemId?: (item: Item) => string
		getItemLabel?: (item: Item) => string
		[key: string]: unknown,
	} = $props()

	// (Derived)
	const selectedItem = $derived(
		value ?
			(items.find((i) => i.address === value) ?? ({ address: value } as Item))
		:	null
	)


	// Functions
	import { normalizeIdentity, resolveIdentity } from '$/api/identity-resolve.ts'
	import { isValidAddress, normalizeAddress } from '$/lib/address.ts'
	import { createProviderForChain, getEffectiveRpcUrl } from '$/lib/helios-rpc.ts'


	// State
	let inputValue = $state(
		''
	)


	// Actions
	const setSelectedItem = (item: Item | null | undefined) => {
		value = item ? item.address : null
	}
	const tryCommitCustomInput = () => {
		const raw = inputValue.trim()
		if (!raw) return
		const { kind, normalized } = normalizeIdentity(raw)
		if (kind === IdentityInputKind.Address && isValidAddress(normalized)) {
			const addr = normalizeAddress(normalized)
			if (addr) setSelectedItem({ address: addr } as Item)
			return
		}
		if (kind === IdentityInputKind.EnsName) {
			const url = getEffectiveRpcUrl(network)
			if (!url) return
			const provider = createProviderForChain(network)
			resolveIdentity(provider, network, raw, null).then((res) => {
				if (res.address) setSelectedItem({ address: res.address } as Item)
			})
		}
	}


	// Components
	import Combobox from '$/components/Combobox.svelte'
	import PatternInput from '$/components/PatternInput.svelte'
	import Address from '$/views/Address.svelte'
</script>


<Combobox
	{...rootProps}
	{items}
	bind:value={() => selectedItem ?? undefined, (item) => setSelectedItem(item)}
	bind:inputValue
	{getItemId}
	{getItemLabel}
	{placeholder}
	{disabled}
	{name}
	{id}
	{ariaLabel}
	getDisplayValue={(v) => (v)}
	onInputBlur={tryCommitCustomInput}
	onInputKeydown={(e) => {
		if (e.key === 'Enter') tryCommitCustomInput()
	}}
>
	{#snippet Item(item, selected)}
		<span data-row="start gap-0" data-selected={selected}>
			<Address actorId={{ $network: network, address: item.address }} isLinked={false} />
		</span>
	{/snippet}

	{#snippet Input(props)}
		<PatternInput
			patternTypes={[PatternType.EvmAddress, PatternType.EnsName]}
			{...props}
		/>
	{/snippet}
</Combobox>
