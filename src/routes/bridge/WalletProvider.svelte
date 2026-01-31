<script lang='ts'>
	// Types/constants
	import type { Snippet } from 'svelte'
	import type { ProviderDetailType, WalletState } from '$/lib/wallet'

	// Context
	import { setContext } from 'svelte'

	// Functions
	import { Button, Switch, Popover } from 'bits-ui'
	import { connectProvider, subscribeProviders, createWalletState } from '$/lib/wallet'

	// Props
	let {
		children,
	}: {
		children: Snippet<[WalletState]>
	} = $props()

	// State
	let state = $state<WalletState>(
		createWalletState(),
	)

	$effect(() => {
		if (typeof window === 'undefined') return
		return subscribeProviders((providers) => {
			state.providers = providers
		})
	})

	// Context
	setContext('wallet', () => state)

	// Actions
	const connect = async (detail: ProviderDetailType) => {
		state.error = null
		state.isConnecting = true
		try {
			state.address = await connectProvider(detail)
			state.connectedDetail = detail
		} catch (e) {
			state.error = e instanceof Error ? e.message : String(e)
		} finally {
			state.isConnecting = false
		}
	}

	const disconnect = () => {
		state.connectedDetail = null
		state.address = null
		state.error = null
	}

	const toggleTestnet = (checked: boolean) => {
		state.isTestnet = checked
	}
</script>

<header data-row='gap-4 wrap' data-wallet-header>
	<div data-row='gap-2 start align-center'>
		<Switch.Root
			checked={state.isTestnet}
			onCheckedChange={toggleTestnet}
			data-wallet-network-switch
		>
			<Switch.Thumb data-wallet-network-thumb />
		</Switch.Root>
		<span data-wallet-network-label>
			{state.isTestnet ? 'Testnet' : 'Mainnet'}
		</span>
	</div>

	{#if state.connectedDetail && state.address}
		<div data-row='gap-2 align-center'>
			{#if state.connectedDetail.info.icon}
				<img
					src={state.connectedDetail.info.icon}
					alt=''
					width='20'
					height='20'
					data-wallet-icon
				/>
			{/if}
			<span data-wallet-address>
				{state.address.slice(0, 6)}…{state.address.slice(-4)}
			</span>
			<Button.Root type='button' onclick={disconnect} data-wallet-disconnect>
				Disconnect
			</Button.Root>
		</div>
	{:else}
		<Popover.Root>
			<Popover.Trigger
				disabled={state.isConnecting}
				data-wallet-connect-trigger
			>
				{state.isConnecting ? 'Connecting…' : 'Connect Wallet'}
			</Popover.Trigger>
			<Popover.Content data-wallet-popover>
				{#if state.providers.length === 0}
					<p data-wallet-empty>No wallets found. Install a wallet extension and refresh.</p>
				{:else}
					<div data-column='gap-2'>
						{#each state.providers as detail (detail.info.uuid)}
							<Button.Root
								type='button'
								disabled={state.isConnecting}
								onclick={() => connect(detail)}
								data-wallet-provider-option
							>
								{#if detail.info.icon}
									<img src={detail.info.icon} alt='' width='20' height='20' />
								{/if}
								<span>{detail.info.name}</span>
							</Button.Root>
						{/each}
					</div>
				{/if}
				{#if state.error}
					<p role='alert' data-wallet-error>{state.error}</p>
				{/if}
			</Popover.Content>
		</Popover.Root>
	{/if}
</header>

{@render children(state)}
