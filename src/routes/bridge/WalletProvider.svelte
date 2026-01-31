<script lang="ts">
	// Types/constants
	import type { Snippet } from 'svelte'
	import type { WalletState } from '$/lib/wallet'

	// Context
	import { useWalletState } from '$/state/wallet.svelte'

	// Props
	let {
		children,
		onStateChange,
	}: {
		children: Snippet<[WalletState]>
		onStateChange?: (
			state: WalletState
		) => void,
	} = $props()

	// State
	const wallet = useWalletState()

	// (Derived)
	$effect(() => {
		onStateChange?.(wallet.state)
	})

	// Components
	import Address from '$/components/Address.svelte'
	import { Button, Popover, Switch } from 'bits-ui'
</script>


<details
	open
	data-card
>
	<summary>
		<header
			data-row="gap-4 wrap"
			data-wallet-header
		>
			<label
				data-row="gap-2 align-center"
				data-wallet-network-toggle
				role="group"
				aria-label="Network type"
			>
				<Switch.Root
					checked={wallet.state.isTestnet}
					onCheckedChange={(c) => wallet.toggleTestnet(c ?? false)}
					aria-label="Mainnets / Testnets"
					data-wallet-network-mainnet={wallet.state.isTestnet ? '' : undefined}
					data-wallet-network-testnet={!wallet.state.isTestnet ? '' : undefined}
				>
					<Switch.Thumb />
				</Switch.Root>
				<span data-wallet-network-label>
					{wallet.state.isTestnet ? 'Testnet' : 'Mainnet'}
				</span>
			</label>

			{#if wallet.state.connectedDetail && wallet.state.address}
				<div
					data-row="gap-2 align-center"
				>
					{#if wallet.state.connectedDetail.info.icon}
						<img
							src={wallet.state.connectedDetail.info.icon}
							alt=""
							width="20"
							height="20"
							loading="lazy"
							decoding="async"
							data-wallet-icon
						/>
					{/if}
					<span data-wallet-address>
						<Address
							network={wallet.state.chainId ?? 1}
							address={wallet.state.address}
						/>
					</span>
					<Button.Root
						type="button"
						onclick={wallet.disconnect}
						data-wallet-disconnect
					>
						Disconnect
					</Button.Root>
				</div>
			{:else}
				<Popover.Root>
					<Popover.Trigger
						disabled={wallet.state.isConnecting}
						data-wallet-connect-trigger
					>
						{wallet.state.isConnecting ? 'Connecting…' : 'Connect Wallet'}
					</Popover.Trigger>
					<Popover.Content data-wallet-popover>
						{#if wallet.state.providers.length === 0}
							<p data-wallet-empty>
								No wallets found. Install a wallet extension and refresh.
							</p>
						{:else}
							<div data-column="gap-2">
								{#each wallet.state.providers as detail (detail.info.uuid)}
									<Button.Root
										type="button"
										disabled={wallet.state.isConnecting}
										onclick={() => wallet.connect(detail)}
										data-wallet-provider-option
									>
										{#if detail.info.icon}
											<img
												src={detail.info.icon}
												alt=""
												width="20"
												height="20"
												loading="lazy"
												decoding="async"
											/>
										{/if}
										<span>{detail.info.name}</span>
									</Button.Root>
								{/each}
							</div>
						{/if}
						{#if wallet.state.error}
							<p
								role="alert"
								data-wallet-error
							>
								{wallet.state.error}
							</p>
						{/if}
					</Popover.Content>
				</Popover.Root>
			{/if}
		</header>
	</summary>

	{@render children(wallet.state)}
</details>


<style>
	[data-wallet-header] {
		padding: 0.75em 1em;
		background: var(--color-bg);
		border-radius: 0.5em;
		border: 1px solid var(--color-border);
	}

	[data-wallet-network-label] {
		font-size: 0.875em;
		font-weight: 500;
		min-width: 5em;
	}

	[data-wallet-icon] {
		border-radius: 0.25em;
	}

	[data-wallet-address] {
		font-family: ui-monospace, monospace;
		font-size: 0.875em;
	}

	:global([data-wallet-connect-trigger]),
	:global([data-wallet-disconnect]) {
		font-size: 0.875em;
	}

	:global([data-wallet-popover]) {
		z-index: 100;
		min-width: 200px;
		padding: 0.75em;
		background: var(--color-bg);
		border: 1px solid var(--color-border);
		border-radius: 0.5em;
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
	}

	:global([data-wallet-provider-option]) {
		width: 100%;
		justify-content: start;
	}

	:global([data-wallet-provider-option] > img) {
		border-radius: 0.25em;
	}

	[data-wallet-empty] {
		font-size: 0.875em;
		opacity: 0.7;
		text-align: center;
		padding: 0.5em;
	}

	[data-wallet-error] {
		color: var(--color-error, #ef4444);
		font-size: 0.875em;
		margin-top: 0.5em;
	}
</style>
