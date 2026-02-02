<script lang="ts">
	// Types/constants
	import type { ConnectedWallet } from '$/collections/wallet-connections'
	import { validateBridgeAmount, USDC_MIN_AMOUNT, USDC_MAX_AMOUNT } from '$/constants/bridge-limits'
	import {
		CCTP_FAST_TRANSFER_SOURCE_CHAIN_IDS,
		CCTP_FORWARDING_CHAIN_IDS,
		getCctpDomainId,
		isCctpSupportedChain,
	} from '$/constants/cctp'
	import { NetworkType, networks, networksByChainId } from '$/constants/networks'

	// Context
	import { Button, Switch } from 'bits-ui'

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
	let transferSpeed = $state<'fast' | 'standard'>('fast')
	let forwardingEnabled = $state(false)
	let feeRows = $state<{ finalityThreshold: number, minimumFee: number }[] | null>(null)
	let feeError = $state<string | null>(null)
	let feeLoading = $state(false)
	let allowance = $state<{ value: number, lastUpdated: string } | null>(null)
	let allowanceError = $state<string | null>(null)
	let allowanceLoading = $state(false)

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
	const feeFastBps = $derived(feeRows?.find((row) => row.finalityThreshold === 1000)?.minimumFee ?? null)
	const feeStandardBps = $derived(feeRows?.find((row) => row.finalityThreshold === 2000)?.minimumFee ?? null)
	const apiHost = $derived(settings.isTestnet ? 'https://iris-api-sandbox.circle.com' : 'https://iris-api.circle.com')
	const recipient = $derived(
		settings.useCustomRecipient && isValidAddress(settings.customRecipient)
			? settings.customRecipient
			: selectedActor
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

	$effect(() => {
		const source = fromDomain
		const destination = toDomain
		if (source === null || destination === null) {
			feeRows = null
			return
		}
		let cancelled = false
		feeLoading = true
		feeError = null
		fetch(`${apiHost}/v2/burn/USDC/fees/${source}/${destination}`, {
			headers: { Accept: 'application/json' },
		})
			.then((res) => (
				res.ok
					? res.json()
					: Promise.reject(new Error(`Fee request failed (${res.status})`))
			))
			.then((data) => {
				if (!cancelled) feeRows = Array.isArray(data) ? data : null
			})
			.catch((err: Error) => {
				if (!cancelled) feeError = err.message
			})
			.finally(() => {
				if (!cancelled) feeLoading = false
			})
		return () => { cancelled = true }
	})

	$effect(() => {
		if (!fastTransferSupported) {
			allowance = null
			return
		}
		let cancelled = false
		allowanceLoading = true
		allowanceError = null
		fetch(`${apiHost}/v2/fastBurn/USDC/allowance`, {
			headers: { Accept: 'application/json' },
		})
			.then((res) => (
				res.ok
					? res.json()
					: Promise.reject(new Error(`Allowance request failed (${res.status})`))
			))
			.then((data) => {
				if (cancelled) return
				if (typeof data?.allowance === 'number' && typeof data?.lastUpdated === 'string') {
					allowance = { value: data.allowance, lastUpdated: data.lastUpdated }
				} else {
					allowance = null
				}
			})
			.catch((err: Error) => {
				if (!cancelled) allowanceError = err.message
			})
			.finally(() => {
				if (!cancelled) allowanceLoading = false
			})
		return () => { cancelled = true }
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

	// Components
	import Select from '$/components/Select.svelte'
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

		<div data-column="gap-1">
			<strong>Fees</strong>
			{#if feeLoading}
				<small data-muted>Loading fees…</small>
			{:else if feeError}
				<small data-error>{feeError}</small>
			{:else if feeFastBps !== null || feeStandardBps !== null}
				<dl data-summary>
					<dt>Fast</dt><dd>{feeFastBps ?? '—'} bps</dd>
					<dt>Standard</dt><dd>{feeStandardBps ?? '—'} bps</dd>
				</dl>
			{:else}
				<small data-muted>Select a valid chain pair to load fees.</small>
			{/if}
		</div>

		<div data-column="gap-1">
			<strong>Fast transfer allowance</strong>
			{#if !fastTransferSupported}
				<small data-muted>Not required for this source chain.</small>
			{:else if allowanceLoading}
				<small data-muted>Loading allowance…</small>
			{:else if allowanceError}
				<small data-error>{allowanceError}</small>
			{:else if allowance}
				<small data-muted>{allowance.value.toLocaleString()} USDC · Updated {allowance.lastUpdated}</small>
			{:else}
				<small data-muted>Allowance unavailable.</small>
			{/if}
		</div>

		<div data-column="gap-2">
			<strong>Status</strong>
			<ol data-status>
				<li data-status-step>Burn on {fromNetwork?.name ?? 'source chain'}</li>
				<li data-status-step>Attestation available</li>
				<li data-status-step>Mint on {toNetwork?.name ?? 'destination chain'}</li>
			</ol>
			<Button.Root
				type="button"
				disabled={!cctpPairSupported || !canSendAmount || !selectedWallet}
			>
				Bridge via CCTP
			</Button.Root>
			<small data-muted>TODO: wire CCTP onchain execution.</small>
		</div>
	</section>
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

	[data-status] {
		margin: 0;
		padding-inline-start: 1.2em;
	}
</style>
