<script lang="ts">
	// Types/constants
	import type { Snippet } from 'svelte'
	import type { WalletRow } from '$/collections/wallets'
	import type { WalletConnectionRow } from '$/collections/wallet-connections'

	// Context
	import { useLiveQuery } from '@tanstack/svelte-db'
	import { useWalletSubscriptions } from '$/state/wallet.svelte'

	// State
	import { bridgeSettingsState, defaultBridgeSettings } from '$/state/bridge-settings.svelte'

	// Collections
	import { walletsCollection } from '$/collections/wallets'
	import {
		walletConnectionsCollection,
		requestWalletConnection,
		switchActiveActor,
		selectConnection,
		disconnectWallet,
	} from '$/collections/wallet-connections'

	// Components
	import Address from '$/components/Address.svelte'
	import { Button, DropdownMenu, Switch, ToggleGroup } from 'bits-ui'

	// Props
	export type ConnectedWallet = { wallet: WalletRow; connection: WalletConnectionRow }
	let {
		children,
	}: {
		children: Snippet<[{
			connectedWallets: ConnectedWallet[]
			selectedActor: `0x${string}` | null
			selectedChainId: number | null
		}]>,
	} = $props()

	// Initialize wallet subscriptions (EIP-6963, chain/account changes)
	useWalletSubscriptions()

	// Queries
	const walletsQuery = useLiveQuery((q) => q.from({ row: walletsCollection }).select(({ row }) => ({ row })))
	const connectionsQuery = useLiveQuery((q) => q.from({ row: walletConnectionsCollection }).select(({ row }) => ({ row })))

	// (Derived) - join wallet + connection by rdns; skip malformed rows (e.g. old localStorage, bad EIP-6963)
	const settings = $derived(bridgeSettingsState.current ?? defaultBridgeSettings)
	const connections = $derived((connectionsQuery.data ?? []).map((c) => c.row).filter((c) => c?.$id?.wallet$id?.rdns))
	const wallets = $derived((walletsQuery.data ?? []).map((w) => w.row).filter((w) => w?.$id?.rdns))

	const walletsByRdns = $derived(new Map(wallets.map((w) => [w.$id.rdns, w])))

	const joinWallet = (c: WalletConnectionRow): ConnectedWallet | null => {
		const wallet = walletsByRdns.get(c.$id.wallet$id.rdns)
		return wallet ? { wallet, connection: c } : null
	}

	const connectedWallets = $derived<ConnectedWallet[]>(
		connections
			.filter((c) => c.status === 'connected')
			.map(joinWallet)
			.filter((w): w is ConnectedWallet => w !== null)
	)

	const connectingWallets = $derived<ConnectedWallet[]>(
		connections
			.filter((c) => c.status === 'connecting')
			.map(joinWallet)
			.filter((w): w is ConnectedWallet => w !== null)
	)

	const failedWallets = $derived<ConnectedWallet[]>(
		connections
			.filter((c) => c.status === 'error')
			.map(joinWallet)
			.filter((w): w is ConnectedWallet => w !== null)
	)

	const connectedRdns = $derived(new Set(connections.map((c) => c.$id.wallet$id.rdns)))
	const availableWallets = $derived(wallets.filter((w) => !connectedRdns.has(w.$id.rdns)))

	const selectedConnection = $derived(connectedWallets.find((w) => w.connection.selected) ?? null)
	const selectedActor = $derived(selectedConnection?.connection.activeActor ?? null)
	const selectedChainId = $derived(selectedConnection?.connection.chainId ?? null)

	const walletChips = $derived<Array<ConnectedWallet & { status: 'connected' | 'connecting' | 'error' }>>([
		...connectedWallets.map((c) => ({ ...c, status: 'connected' as const })),
		...connectingWallets.map((c) => ({ ...c, status: 'connecting' as const })),
		...failedWallets.map((c) => ({ ...c, status: 'error' as const })),
	])

	// Actions
	const connect = (rdns: string) => {
		requestWalletConnection({ rdns }).catch(() => {})
	}

	const toggleTestnet = (checked: boolean) => {
		bridgeSettingsState.current = { ...settings, isTestnet: checked }
	}
</script>


<details open data-card>
	<summary>
		<header data-card="secondary" data-row="wrap gap-2">
			<label data-row="gap-2" role="group" aria-label="Network type">
			<Switch.Root
				checked={settings.isTestnet}
				onCheckedChange={(c) => toggleTestnet(c ?? false)}
				aria-label="Mainnets / Testnets"
			>
				<Switch.Thumb />
			</Switch.Root>
			<span>{settings.isTestnet ? 'Testnet' : 'Mainnet'}</span>
		</label>

		{#if walletChips.length > 0}
			<ToggleGroup.Root
				type="single"
				value={selectedConnection?.wallet.$id.rdns}
				onValueChange={(v) => { if (v) selectConnection({ rdns: v }) }}
				data-row="wrap gap-2"
			>
				{#each walletChips as { wallet, connection, status } (wallet.$id.rdns)}
					{#if status === 'connected'}
						<ToggleGroup.Item
							value={wallet.$id.rdns}
							data-tag="wallet-type"
							data-selected={connection.selected}
						>
									{#if wallet.icon}
										<img
											src={wallet.icon}
											alt=""
											width="16"
											height="16"
											loading="lazy"
											decoding="async"
										/>
									{/if}
									{#if connection.activeActor}
										<Address
											network={selectedChainId ?? 1}
											address={connection.activeActor}
											linked={false}
										/>
									{:else}
										—
									{/if}
									<DropdownMenu.Root>
										<DropdownMenu.Trigger onclick={(e: MouseEvent) => e.stopPropagation()}>
											<svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
												<circle cx="6" cy="2" r="1.5" />
												<circle cx="6" cy="6" r="1.5" />
												<circle cx="6" cy="10" r="1.5" />
											</svg>
										</DropdownMenu.Trigger>
										<DropdownMenu.Portal>
											<DropdownMenu.Content>
												{#if (connection.actors ?? []).length > 0}
													<DropdownMenu.Sub>
														<DropdownMenu.SubTrigger>
															Switch Actor
														</DropdownMenu.SubTrigger>
														<DropdownMenu.SubContent>
															{#each (connection.actors ?? []) as actor (actor)}
																<DropdownMenu.Item
																	data-active={actor === connection.activeActor}
																	onclick={() => switchActiveActor(wallet.$id, actor)}
																>
																	<Address
																		network={selectedChainId ?? 1}
																		address={actor}
																		linked={false}
																	/>
																	{#if actor === connection.activeActor}
																		<span>✓</span>
																	{/if}
																</DropdownMenu.Item>
															{/each}
														</DropdownMenu.SubContent>
													</DropdownMenu.Sub>
													<DropdownMenu.Separator />
												{/if}
												<DropdownMenu.Item onclick={() => disconnectWallet(wallet.$id)}>
													Disconnect
												</DropdownMenu.Item>
											</DropdownMenu.Content>
										</DropdownMenu.Portal>
									</DropdownMenu.Root>
								</ToggleGroup.Item>
							{:else if status === 'connecting'}
								<div data-tag="wallet-type" data-connecting aria-disabled="true">
									{#if wallet.icon}
										<img
											src={wallet.icon}
											alt=""
											width="16"
											height="16"
											loading="lazy"
											decoding="async"
										/>
									{/if}
									{#if connection.activeActor}
										<span>
											<Address
												network={connection.chainId ?? selectedChainId ?? 1}
												address={connection.activeActor}
												linked={false}
											/>
											<br />
											Reconnecting
										</span>
									{:else}
										<span>Connecting…</span>
									{/if}
									<Button.Root type="button" onclick={() => disconnectWallet(wallet.$id)}>
										×
									</Button.Root>
								</div>
							{:else}
								<div data-tag="wallet-type" data-failed aria-disabled="true">
									{#if wallet.icon}
										<img
											src={wallet.icon}
											alt=""
											width="16"
											height="16"
											loading="lazy"
											decoding="async"
										/>
									{/if}
									<span>Locked</span>
									<Button.Root type="button" onclick={() => disconnectWallet(wallet.$id)}>
										×
									</Button.Root>
								</div>
							{/if}
						{/each}
					</ToggleGroup.Root>
				{/if}

				{#if availableWallets.length > 0}
					<DropdownMenu.Root>
						<DropdownMenu.Trigger>
							Connect Wallet
						</DropdownMenu.Trigger>
						<DropdownMenu.Portal>
							<DropdownMenu.Content>
								{#each availableWallets as w (w.$id.rdns)}
									<DropdownMenu.Item onclick={() => connect(w.$id.rdns)}>
										{#if w.icon}
											<img
												src={w.icon}
												alt=""
												width="20"
												height="20"
												loading="lazy"
												decoding="async"
											/>
										{/if}
										<span>{w.name}</span>
									</DropdownMenu.Item>
								{/each}
							</DropdownMenu.Content>
						</DropdownMenu.Portal>
					</DropdownMenu.Root>
				{:else if wallets.length === 0}
					<span>No wallets detected</span>
				{/if}
		</header>
	</summary>

	{@render children({ connectedWallets, selectedActor, selectedChainId })}
</details>


<style>
	[data-tag][data-selected="true"] {
		border-color: color-mix(in srgb, var(--color-accent) 60%, transparent);
		background: color-mix(in srgb, var(--color-accent) 15%, transparent);
	}

	[data-tag][data-connecting],
	[data-tag][data-failed] {
		opacity: 0.7;
		cursor: default;
	}
</style>
