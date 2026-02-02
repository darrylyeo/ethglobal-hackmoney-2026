<script lang="ts">
	// Types/constants
	import type { ConnectedWallet } from '$/collections/wallet-connections'
	import { validateBridgeAmount, USDC_MIN_AMOUNT, USDC_MAX_AMOUNT } from '$/constants/bridge-limits'
	import { isCctpSupportedChain } from '$/constants/cctp'
	import { NetworkType, networks, networksByChainId } from '$/constants/networks'

	// Context
	import { Switch } from 'bits-ui'

	// Props
	let {
		selectedWallets,
		selectedActor,
	}: {
		selectedWallets: ConnectedWallet[],
		selectedActor: `0x${string}` | null,
	} = $props()

	// (Derived)
	const selectedWallet = $derived(
		selectedWallets.find((w) => w.connection.selected) ?? null
	)

	// Functions
	import { formatAddress, isValidAddress } from '$/lib/address'
	import { formatSmallestToDecimal, isValidDecimalInput, parseDecimalToSmallest } from '$/lib/format'

	// State
	import { bridgeSettingsState, defaultBridgeSettings } from '$/state/bridge-settings.svelte'

	let invalidAmountInput = $state(false)
	let protocolIntent = $state<'cctp' | 'lifi' | null>(null)

	// (Derived)
	const settings = $derived(bridgeSettingsState.current ?? defaultBridgeSettings)
	const filteredNetworks = $derived(
		networks.filter((n) => (
			settings.isTestnet
				? n.type === NetworkType.Testnet
				: n.type === NetworkType.Mainnet
		))
	)
	const fromNetwork = $derived(settings.fromChainId !== null ? networksByChainId[settings.fromChainId] : null)
	const toNetwork = $derived(settings.toChainId !== null ? networksByChainId[settings.toChainId] : null)
	const validation = $derived(validateBridgeAmount(settings.amount, USDC_MIN_AMOUNT, USDC_MAX_AMOUNT))
	const canSendAmount = $derived(validation.isValid && !invalidAmountInput)
	const cctpPairSupported = $derived(
		isCctpSupportedChain(settings.fromChainId) && isCctpSupportedChain(settings.toChainId)
	)
	const lifiPairSupported = $derived(
		settings.fromChainId !== null && settings.toChainId !== null
	)
	const activeProtocol = $derived(
		cctpPairSupported && !lifiPairSupported
			? 'cctp'
		: lifiPairSupported && !cctpPairSupported
			? 'lifi'
		: cctpPairSupported && lifiPairSupported
			? (protocolIntent ?? 'cctp')
			: null
	)
	const protocolReason = $derived(
		!settings.fromChainId || !settings.toChainId
			? 'Select chains to determine protocol'
		: cctpPairSupported && !lifiPairSupported
			? 'Only CCTP supports this pair'
		: lifiPairSupported && !cctpPairSupported
			? 'Only LI.FI supports this pair'
		: protocolIntent === 'cctp'
			? 'Preferring CCTP based on your selection'
		: protocolIntent === 'lifi'
			? 'Preferring LI.FI based on your selection'
		:
			'Defaulting to CCTP for USDC transfers'
	)
	const recipient = $derived(
		settings.useCustomRecipient && isValidAddress(settings.customRecipient)
			? settings.customRecipient
			: selectedActor
	)

	// Actions
	const onAmountInput = (e: Event) => {
		const v = (e.target as HTMLInputElement).value.replace(/[^0-9.,]/g, '').replace(/,/g, '')
		if (v === '') {
			invalidAmountInput = false
			bridgeSettingsState.current = { ...settings, amount: 0n }
		} else if (isValidDecimalInput(v, 6)) {
			invalidAmountInput = false
			bridgeSettingsState.current = { ...settings, amount: parseDecimalToSmallest(v, 6) }
		} else {
			invalidAmountInput = true
		}
	}

	// Components
	import Select from '$/components/Select.svelte'
	import UnifiedProtocolRouter from './UnifiedProtocolRouter.svelte'
</script>


<div data-bridge-layout>
	<section data-card data-column="gap-4">
		<h2>Bridge USDC</h2>

		<div data-row="gap-4">
			<div data-column="gap-1" style="flex:1" data-from-chain>
				<label for="from">From</label>
				<Select
					items={filteredNetworks}
					value={settings.fromChainId?.toString() ?? ''}
					onValueChange={(v) => {
						if (!v) return
						bridgeSettingsState.current = { ...settings, fromChainId: Number(v) }
					}}
					getItemId={(network) => String(network.id)}
					getItemLabel={(network) => network.name}
					placeholder="—"
					id="from"
					ariaLabel="From chain"
				/>
			</div>
			<div data-column="gap-1" style="flex:1" data-to-chain>
				<label for="to">To</label>
				<Select
					items={filteredNetworks}
					value={settings.toChainId?.toString() ?? ''}
					onValueChange={(v) => {
						if (!v) return
						bridgeSettingsState.current = { ...settings, toChainId: Number(v) }
					}}
					getItemId={(network) => String(network.id)}
					getItemLabel={(network) => network.name}
					placeholder="—"
					id="to"
					ariaLabel="To chain"
				/>
			</div>
		</div>

		<div data-column="gap-1">
			<label for="amt">Amount</label>
			<input
				id="amt"
				type="text"
				inputmode="decimal"
				placeholder="0.00"
				value={settings.amount === 0n ? '' : formatSmallestToDecimal(settings.amount, 6)}
				oninput={onAmountInput}
			/>
			{#if invalidAmountInput}
				<small data-error>Invalid amount (use numbers and up to 6 decimals)</small>
			{:else if validation.error === 'too_low'}
				<small data-error>Min {validation.minAmount} USDC</small>
			{:else if validation.error === 'too_high'}
				<small data-error>Max {validation.maxAmount} USDC</small>
			{:else if validation.error === 'invalid'}
				<small data-error>Enter a valid amount</small>
			{/if}
		</div>

		<div data-column="gap-1">
			<label data-row="gap-2 align-center">
				<Switch.Root
					checked={settings.useCustomRecipient}
					onCheckedChange={(c) => {
						bridgeSettingsState.current = { ...settings, useCustomRecipient: c ?? false }
					}}
				>
					<Switch.Thumb />
				</Switch.Root>
				Different recipient
			</label>
			{#if settings.useCustomRecipient}
				<input
					type="text"
					placeholder="0x..."
					value={settings.customRecipient}
					oninput={(e) => {
						bridgeSettingsState.current = { ...settings, customRecipient: (e.target as HTMLInputElement).value }
					}}
				/>
				{#if settings.customRecipient && !isValidAddress(settings.customRecipient)}
					<small data-error>Invalid address</small>
				{/if}
			{:else if selectedActor}
				<small data-muted>To: {formatAddress(selectedActor)}</small>
			{:else}
				<small data-muted>To: Connect wallet</small>
			{/if}
		</div>
	</section>

	<UnifiedProtocolRouter
		bind:protocolIntent
		{activeProtocol}
		{protocolReason}
		{cctpPairSupported}
		{lifiPairSupported}
		{selectedWallet}
		{selectedActor}
		{fromNetwork}
		{toNetwork}
		{recipient}
		{canSendAmount}
	/>
</div>

<style>
	[data-bridge-layout] {
		display: grid;
		gap: 1.5em;
		grid-template-columns: 1fr;
	}

	@media (min-width: 768px) {
		[data-bridge-layout] {
			grid-template-columns: 1fr 1fr;
			gap: 2em;
		}
	}
</style>
