<script lang="ts">
	// Types/constants
	import { Switch } from 'bits-ui'
	import { isValidAddress, normalizeAddress, formatAddress } from '$/lib/address'
	import { networksByChainId } from '$/constants/networks'

	// Props
	let {
		walletAddress,
		toNetworkId,
		recipient = $bindable(),
	}: {
		walletAddress: `0x${string}`
		toNetworkId: number
		recipient?: `0x${string}`
	} = $props()

	// State
	let useCustomRecipient = $state(false)
	let customAddress = $state('')

	// (Derived)
	const isValid = $derived(
		!useCustomRecipient || isValidAddress(customAddress),
	)
	const normalized = $derived(
		useCustomRecipient
			? normalizeAddress(customAddress)
			: walletAddress,
	)
	const isDifferentAddress = $derived(
		normalized !== null && normalized.toLowerCase() !== walletAddress.toLowerCase(),
	)
	const networkName = $derived(
		networksByChainId[toNetworkId]?.name ?? `Network ${toNetworkId}`,
	)

	// Actions
	$effect(() => {
		recipient = normalized ?? walletAddress
	})

	const toggleCustom = (checked: boolean) => {
		useCustomRecipient = checked
		if (!checked) customAddress = ''
	}
</script>

<div data-recipient-input data-column="gap-2">
	<div data-row="gap-2 align-center">
		<Switch.Root
			checked={useCustomRecipient}
			onCheckedChange={toggleCustom}
			aria-label="Send to different address"
		>
			<Switch.Thumb />
		</Switch.Root>
		<span>Send to different address</span>
	</div>

	{#if useCustomRecipient}
		<div data-column="gap-2">
			<label for="recipient-address">Recipient address</label>
			<input
				id="recipient-address"
				type="text"
				placeholder="0x..."
				autocomplete="off"
				spellcheck="false"
				bind:value={customAddress}
				data-invalid={customAddress && !isValid ? '' : undefined}
			/>
			{#if customAddress && !isValid}
				<p data-error role="alert">Invalid address format</p>
			{/if}
		</div>

		{#if isDifferentAddress && isValid}
			<div data-recipient-warning data-card="secondary" data-column="gap-2" role="alert">
				<strong>⚠️ Sending to a different address</strong>
				<p>
					Tokens will be sent to <code>{formatAddress(normalized ?? '')}</code> on {networkName}.
					Make sure you control this address.
				</p>
			</div>
		{/if}
	{:else}
		<p data-muted>
			Receiving to: <code>{formatAddress(walletAddress)}</code> (your wallet)
		</p>
	{/if}
</div>

<style>
	[data-recipient-input] input[data-invalid] {
		border-color: var(--color-error, #ef4444);
	}

	[data-recipient-warning] {
		background: var(--color-warning-bg, #fef3c7);
	}
</style>
