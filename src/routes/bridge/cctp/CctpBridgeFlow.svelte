<script lang="ts">
	// Types/constants
	import type { ConnectedWallet } from '$/collections/wallet-connections'
	import { WalletConnectionTransport } from '$/collections/wallet-connections'
	import { validateBridgeAmount, USDC_MIN_AMOUNT, USDC_MAX_AMOUNT } from '$/constants/bridge-limits'
	import {
		CCTP_FAST_TRANSFER_SOURCE_CHAIN_IDS,
		CCTP_FORWARDING_CHAIN_IDS,
		getCctpDomainId,
		isCctpSupportedChain,
	} from '$/constants/cctp'
	import { NetworkType, networks, networksByChainId } from '$/constants/networks'

	// Context
	import { Button, Dialog, Switch } from 'bits-ui'

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
	const walletProvider = $derived(
		selectedWallet?.connection.transport === WalletConnectionTransport.Eip1193
			? (selectedWallet.wallet as { provider: import('$lib/wallet').EIP1193Provider }).provider
			: null
	)

	// Functions
	import { formatAddress, isValidAddress } from '$/lib/address'
	import { formatSmallestToDecimal, isValidDecimalInput, parseDecimalToSmallest } from '$/lib/format'

	// State
	import { bridgeSettingsState, defaultBridgeSettings } from '$/state/bridge-settings.svelte'

	let invalidAmountInput = $state(false)
	let transferSpeed = $state<'fast' | 'standard'>('fast')
	let forwardingEnabled = $state(false)
	let confirmOpen = $state(false)
	let feeFastBps = $state<number | null>(null)
	let feeStandardBps = $state<number | null>(null)
	let executing = $state(false)
	let runExecutionAt = $state(0)

	// (Derived)
	const settings = $derived(bridgeSettingsState.current ?? defaultBridgeSettings)
	const filteredNetworks = $derived(
		networks.filter((n) => (
			settings.isTestnet
				? n.type === NetworkType.Testnet
				: n.type === NetworkType.Mainnet
		))
	)
	const cctpNetworks = $derived(filteredNetworks.filter((n) => isCctpSupportedChain(n.id)))
	const fromNetwork = $derived(settings.fromChainId !== null ? networksByChainId[settings.fromChainId] : null)
	const toNetwork = $derived(settings.toChainId !== null ? networksByChainId[settings.toChainId] : null)
	const fromDomain = $derived(getCctpDomainId(settings.fromChainId))
	const toDomain = $derived(getCctpDomainId(settings.toChainId))
	const cctpPairSupported = $derived(fromDomain !== null && toDomain !== null)
	const fastTransferSupported = $derived(
		settings.fromChainId !== null && CCTP_FAST_TRANSFER_SOURCE_CHAIN_IDS.has(settings.fromChainId)
	)
	const effectiveTransferSpeed = $derived(
		fastTransferSupported ? transferSpeed : 'standard'
	)
	const forwardingSupported = $derived(
		settings.toChainId !== null && CCTP_FORWARDING_CHAIN_IDS.has(settings.toChainId)
	)
	const validation = $derived(validateBridgeAmount(settings.amount, USDC_MIN_AMOUNT, USDC_MAX_AMOUNT))
	const canSendAmount = $derived(validation.isValid && !invalidAmountInput)
	const minFinalityThreshold = $derived(effectiveTransferSpeed === 'fast' ? 1000 : 2000)
	const feeBps = $derived(
		effectiveTransferSpeed === 'fast'
			? (feeFastBps ?? feeStandardBps ?? 0)
			: (feeStandardBps ?? feeFastBps ?? 0),
	)
	const apiHost = $derived(settings.isTestnet ? 'https://iris-api-sandbox.circle.com' : 'https://iris-api.circle.com')
	const recipient = $derived(
		settings.useCustomRecipient && isValidAddress(settings.customRecipient)
			? (settings.customRecipient as `0x${string}`)
			: selectedActor
	)
	const expectedReceive = $derived(
		feeBps > 0 && settings.amount > 0n
			? settings.amount - (settings.amount * BigInt(feeBps)) / 10000n
			: settings.amount
	)

	$effect(() => {
		if (cctpNetworks.length === 0) return
		const nextFrom = cctpNetworks.some((n) => n.id === settings.fromChainId)
			? settings.fromChainId
			: cctpNetworks[0]?.id ?? null
		const nextTo = cctpNetworks.some((n) => n.id === settings.toChainId)
			? settings.toChainId
			: cctpNetworks[1]?.id ?? cctpNetworks[0]?.id ?? null
		if (nextFrom === settings.fromChainId && nextTo === settings.toChainId) return
		bridgeSettingsState.current = {
			...settings,
			fromChainId: nextFrom,
			toChainId: nextTo,
		}
	})

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
	const onConfirmBridge = () => {
		confirmOpen = true
	}
	const onConfirmSubmit = () => {
		confirmOpen = false
		runExecutionAt = Date.now()
	}

	// Components
	import Select from '$/components/Select.svelte'
	import CctpAllowance from './CctpAllowance.svelte'
	import CctpExecution from './CctpExecution.svelte'
	import CctpFees from './CctpFees.svelte'
</script>


<div data-bridge-layout>
	<section data-card data-column="gap-4">
		<h2>Bridge USDC (CCTP)</h2>

		<div data-row="gap-4">
			<div data-column="gap-1" style="flex:1" data-from-chain>
				<label for="from">From</label>
				<Select
					items={cctpNetworks}
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
					items={cctpNetworks}
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

		{#if canSendAmount && recipient && fromNetwork && toNetwork}
			<div data-preview data-column="gap-1">
				<strong>Transfer preview</strong>
				<dl data-summary>
					<dt>Burn</dt><dd>{formatSmallestToDecimal(settings.amount, 6)} USDC on {fromNetwork.name}</dd>
					<dt>Receive</dt><dd>~{formatSmallestToDecimal(expectedReceive, 6)} USDC on {toNetwork.name}</dd>
					<dt>Recipient</dt><dd>{formatAddress(recipient)}</dd>
				</dl>
			</div>
		{/if}
	</section>

	<section data-card data-column="gap-3">
		<h3>CCTP Settings</h3>
		<div data-column="gap-2">
			<strong>Transfer speed</strong>
			<div data-row="gap-2">
				<Button.Root
					type="button"
					disabled={!fastTransferSupported}
					data-selected={effectiveTransferSpeed === 'fast' ? '' : undefined}
					onclick={() => { transferSpeed = 'fast' }}
				>
					Fast
				</Button.Root>
				<Button.Root
					type="button"
					data-selected={effectiveTransferSpeed === 'standard' ? '' : undefined}
					onclick={() => { transferSpeed = 'standard' }}
				>
					Standard
				</Button.Root>
			</div>
			{#if !fastTransferSupported}
				<small data-muted>Fast transfer is not supported for {fromNetwork?.name ?? 'this source chain'}.</small>
			{/if}
		</div>

		{#if forwardingSupported}
			<label data-row="gap-2 align-center">
				<Switch.Root
					checked={forwardingEnabled}
					onCheckedChange={(c) => { forwardingEnabled = c ?? false }}
				>
					<Switch.Thumb />
				</Switch.Root>
				Use Forwarding Service
			</label>
		{/if}

		<CctpFees
			fromDomain={fromDomain}
			toDomain={toDomain}
			apiHost={apiHost}
			bind:fastBps={feeFastBps}
			bind:standardBps={feeStandardBps}
		/>

		<CctpAllowance
			fastTransferSupported={fastTransferSupported}
			apiHost={apiHost}
		/>

		<div data-column="gap-2">
			<CctpExecution
				bind:executing
				walletProvider={walletProvider}
				senderAddress={selectedActor}
				fromChainId={settings.fromChainId}
				toChainId={settings.toChainId}
				amount={settings.amount}
				mintRecipient={recipient ?? '0x0000000000000000000000000000000000000000'}
				minFinalityThreshold={minFinalityThreshold}
				feeBps={feeBps}
				isTestnet={settings.isTestnet}
				runAt={runExecutionAt}
			/>
			<Button.Root
				type="button"
				disabled={!cctpPairSupported || !canSendAmount || !selectedWallet || !recipient || executing}
				onclick={onConfirmBridge}
			>
				Bridge via CCTP
			</Button.Root>
		</div>
	</section>
</div>

<Dialog.Root bind:open={confirmOpen}>
	<Dialog.Portal>
		<Dialog.Content>
			<Dialog.Title>Confirm CCTP transfer</Dialog.Title>
			{#if fromNetwork && toNetwork && recipient}
				<Dialog.Description>
					Send {formatSmallestToDecimal(settings.amount, 6)} USDC from {fromNetwork.name} to {toNetwork.name}.
					Recipient: {formatAddress(recipient)}.
				</Dialog.Description>
			{/if}
			<div data-dialog-actions>
				<Button.Root type="button" onclick={() => { confirmOpen = false }}>Cancel</Button.Root>
				<Button.Root type="button" onclick={onConfirmSubmit}>Confirm</Button.Root>
			</div>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>

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

	[data-summary] {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 0.25em 1em;
	}

	[data-summary] dt,
	[data-summary] dd {
		margin: 0;
	}

	[data-summary] dt {
		opacity: 0.7;
	}

	[data-dialog-actions] {
		display: flex;
		gap: 0.5rem;
		margin-top: 1rem;
	}
</style>
