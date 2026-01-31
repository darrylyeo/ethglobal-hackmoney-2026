<script lang='ts'>
	// Types/constants
	import type { EIP1193Provider } from '$/lib/wallet'
	import { networksByChainId } from '$/constants/networks'

	// Functions
	import { Button } from 'bits-ui'
	import { switchWalletChain } from '$/lib/wallet'

	// Props
	let {
		currentChainId,
		requiredChainId,
		provider,
		onSwitched,
	}: {
		currentChainId: number
		requiredChainId: number
		provider: EIP1193Provider
		onSwitched?: () => void
	} = $props()

	// State
	let switching = $state(false)
	let error = $state<string | null>(null)

	const requiredChainName = $derived(
		networksByChainId[requiredChainId as keyof typeof networksByChainId]?.name ?? `Chain ${requiredChainId}`,
	)
	const currentChainName = $derived(
		networksByChainId[currentChainId as keyof typeof networksByChainId]?.name ?? `Chain ${currentChainId}`,
	)

	// Actions
	const handleSwitch = async () => {
		switching = true
		error = null
		try {
			await switchWalletChain(provider, requiredChainId)
			onSwitched?.()
		} catch (e) {
			error = e instanceof Error ? e.message : String(e)
		} finally {
			switching = false
		}
	}
</script>

<div data-chain-switch-prompt role='alert'>
	<p>
		Your wallet is connected to <strong>{currentChainName}</strong>.
		Switch to <strong>{requiredChainName}</strong> to continue.
	</p>
	<Button.Root type='button' onclick={handleSwitch} disabled={switching} data-chain-switch-button>
		{switching ? 'Switching…' : `Switch to ${requiredChainName}`}
	</Button.Root>
	{#if error}
		<p data-chain-switch-error>{error}</p>
	{/if}
</div>

<style>
	[data-chain-switch-prompt] {
		padding: 1em;
		background: var(--color-warning-bg, #fef3c7);
		border-radius: 0.5em;
		display: flex;
		flex-direction: column;
		gap: 0.75em;
	}

	[data-chain-switch-error] {
		color: var(--color-error, #ef4444);
		font-size: 0.875em;
	}
</style>
