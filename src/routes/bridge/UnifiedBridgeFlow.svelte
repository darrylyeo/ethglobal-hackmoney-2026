<script lang="ts">
	// Types/constants
	import type { ConnectedWallet } from '$/collections/wallet-connections'
	import { ercTokens, ercTokensBySymbolByChainId } from '$/constants/coins'
	import {
		validateBridgeAmount,
		USDC_MIN_AMOUNT,
		USDC_MAX_AMOUNT,
	} from '$/constants/bridge-limits'
	import { isCctpSupportedChain } from '$/constants/cctp'
	import {
		NetworkType,
		networks,
		networksByChainId,
	} from '$/constants/networks'

	// Context
	import { Switch } from 'bits-ui'

	// Props
	let {
		selectedWallets,
		selectedActor,
	}: {
		selectedWallets: ConnectedWallet[]
		selectedActor: `0x${string}` | null
	} = $props()

	// (Derived)
	const selectedWallet = $derived(
		selectedWallets.find((w) => w.connection.selected) ?? null,
	)

	// Functions
	import { formatAddress, isValidAddress, normalizeAddress } from '$/lib/address'

	// State
	import {
		bridgeSettingsState,
		defaultBridgeSettings,
	} from '$/state/bridge-settings.svelte'

	let invalidAmountInput = $state(false)
	let protocolIntent = $state<'cctp' | 'lifi' | null>(null)

	// (Derived)
	const settings = $derived(
		bridgeSettingsState.current ?? defaultBridgeSettings,
	)
	const usdcToken = $derived(
		settings.fromChainId !== null
			? (ercTokensBySymbolByChainId[settings.fromChainId]?.['USDC'] ??
					ercTokens[0])
			: ercTokens[0],
	)
	const filteredNetworks = $derived(
		networks.filter((n) =>
			settings.isTestnet
				? n.type === NetworkType.Testnet
				: n.type === NetworkType.Mainnet,
		),
	)
	const fromNetwork = $derived(
		settings.fromChainId !== null
			? networksByChainId[settings.fromChainId]
			: null,
	)
	const toNetwork = $derived(
		settings.toChainId !== null ? networksByChainId[settings.toChainId] : null,
	)
	const validation = $derived(
		validateBridgeAmount(settings.amount, USDC_MIN_AMOUNT, USDC_MAX_AMOUNT),
	)
	const canSendAmount = $derived(validation.isValid && !invalidAmountInput)
	const cctpPairSupported = $derived(
		isCctpSupportedChain(settings.fromChainId) &&
			isCctpSupportedChain(settings.toChainId),
	)
	const lifiPairSupported = $derived(
		settings.fromChainId !== null && settings.toChainId !== null,
	)
	const activeProtocol = $derived(
		cctpPairSupported && !lifiPairSupported
			? 'cctp'
			: lifiPairSupported && !cctpPairSupported
				? 'lifi'
				: cctpPairSupported && lifiPairSupported
					? (protocolIntent ?? 'cctp')
					: null,
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
							: 'Defaulting to CCTP for USDC transfers',
	)
	const recipient = $derived(
		settings.useCustomRecipient
			? normalizeAddress(settings.customRecipient)
			: selectedActor,
	)

	// Components
	import NetworkInput from '$/components/NetworkInput.svelte'
	import CoinAmountInput from '$/components/CoinAmountInput.svelte'
	import UnifiedProtocolRouter from './UnifiedProtocolRouter.svelte'
</script>

<div class="bridge-layout">
	<section data-card data-column="gap-4">
		<h2>Bridge USDC</h2>

		<div data-row="gap-4">
			<div data-column="gap-1" style="flex:1" data-from-chain>
				<label for="from">From</label>
				<NetworkInput
					networks={filteredNetworks}
					value={settings.fromChainId}
					onValueChange={(v) => (
						typeof v === 'number'
							? (bridgeSettingsState.current = {
									...settings,
									fromChainId: v,
								})
							: null
					)}
					placeholder="—"
					id="from"
					ariaLabel="From chain"
				/>
			</div>
			<div data-column="gap-1" style="flex:1" data-to-chain>
				<label for="to">To</label>
				<NetworkInput
					networks={filteredNetworks}
					value={settings.toChainId}
					onValueChange={(v) => (
						typeof v === 'number'
							? (bridgeSettingsState.current = { ...settings, toChainId: v })
							: null
					)}
					placeholder="—"
					id="to"
					ariaLabel="To chain"
				/>
			</div>
		</div>

		<div data-column="gap-1">
			<label for="amt">Amount</label>
			<CoinAmountInput
				id="amt"
				coins={[usdcToken]}
				coin={usdcToken}
				min={USDC_MIN_AMOUNT}
				max={USDC_MAX_AMOUNT}
				value={settings.amount}
				onValueChange={(nextAmount) => {
					bridgeSettingsState.current = { ...settings, amount: nextAmount }
				}}
				onInvalidChange={(nextInvalid) => {
					invalidAmountInput = nextInvalid
				}}
			/>
			{#if invalidAmountInput}
				<small data-error
					>Invalid amount (use numbers and up to 6 decimals)</small
				>
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
						bridgeSettingsState.current = {
							...settings,
							useCustomRecipient: c ?? false,
						}
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
						bridgeSettingsState.current = {
							...settings,
							customRecipient: (e.target as HTMLInputElement).value,
						}
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
	.bridge-layout {
		display: grid;
		gap: 1.5em;
		grid-template-columns: 1fr;
	}

	@media (min-width: 768px) {
		.bridge-layout {
			grid-template-columns: 1fr 1fr;
			gap: 2em;
		}
	}
</style>
