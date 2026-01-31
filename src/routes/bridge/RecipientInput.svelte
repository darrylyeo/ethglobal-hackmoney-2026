<script lang="ts">
	// Types/constants
	import { Switch } from 'bits-ui'
	import { isValidAddress, normalizeAddress, formatAddress } from '$/lib/address'
	import { networksByChainId } from '$/constants/networks'

	// Props
	let {
		walletAddress,
		toChainId,
		recipient = $bindable(),
	}: {
		walletAddress: `0x${string}`
		toChainId: number
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
	const chainName = $derived(
		networksByChainId[toChainId]?.name ?? `Chain ${toChainId}`,
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

<div data-recipient-input>
	<div data-recipient-toggle>
		<Switch.Root checked={useCustomRecipient} onCheckedChange={toggleCustom}>
			<Switch.Thumb />
		</Switch.Root>
		<span>Send to different address</span>
	</div>

	{#if useCustomRecipient}
		<div data-recipient-custom>
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
				<p data-recipient-error role="alert">Invalid address format</p>
			{/if}
		</div>

		{#if isDifferentAddress && isValid}
			<div data-recipient-warning role="alert">
				<strong>⚠️ Sending to a different address</strong>
				<p>
					Tokens will be sent to <code>{formatAddress(normalized ?? '')}</code> on {chainName}.
					Make sure you control this address.
				</p>
			</div>
		{/if}
	{:else}
		<p data-recipient-default>
			Receiving to: <code>{formatAddress(walletAddress)}</code> (your wallet)
		</p>
	{/if}
</div>

<style>
	[data-recipient-toggle] {
		display: flex;
		align-items: center;
		gap: 0.5em;
	}

	[data-recipient-custom] {
		display: flex;
		flex-direction: column;
		gap: 0.5em;
	}

	[data-recipient-custom] input {
		font-family: var(--font-mono);
		font-size: 0.875em;
	}

	[data-recipient-custom] input[data-invalid] {
		border-color: var(--color-error, #ef4444);
	}

	[data-recipient-error] {
		color: var(--color-error, #ef4444);
		font-size: 0.875em;
	}

	[data-recipient-warning] {
		padding: 0.75em;
		background: var(--color-warning-bg, #fef3c7);
		border-radius: 0.5em;
		font-size: 0.875em;
	}

	[data-recipient-warning] code {
		font-family: var(--font-mono);
		background: rgba(0, 0, 0, 0.1);
		padding: 0.125em 0.25em;
		border-radius: 0.25em;
	}

	[data-recipient-default] code {
		font-family: var(--font-mono);
	}
</style>
