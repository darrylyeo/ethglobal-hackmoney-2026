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

<div data-chain-switch-prompt data-card data-column="gap-3" role="alert">
	<p>
		Your wallet is connected to <strong>{currentChainName}</strong>.
		Switch to <strong>{requiredChainName}</strong> to continue.
	</p>
	<Button.Root type="button" onclick={handleSwitch} disabled={switching} data-chain-switch-button>
		{switching ? 'Switching…' : `Switch to ${requiredChainName}`}
	</Button.Root>
	{#if error}
		<p data-error>{error}</p>
	{/if}
</div>
