<script lang="ts">
	// Types/constants
	import type { ConnectedWallet, WalletConnectionRow } from '$/collections/wallet-connections'


	// Context
	import { useLiveQuery } from '@tanstack/svelte-db'
	import { liveQueryAttachmentFrom } from '$/svelte/live-query-context.svelte'
	import { useWalletSubscriptions } from '$/state/wallet.svelte'

	import {
		walletConnectionsCollection,
		requestWalletConnection,
		switchActiveActor,
		selectConnection,
		disconnectWallet,
	} from '$/collections/wallet-connections'
	import { walletsCollection } from '$/collections/wallets'
	import { bridgeSettingsState, defaultBridgeSettings } from '$/state/bridge-settings.svelte'

	useWalletSubscriptions()

	const walletsQuery = useLiveQuery((q) =>
		q.from({ row: walletsCollection }).select(({ row }) => ({ row }))
	)

	const connectionsQuery = useLiveQuery((q) =>
		q.from({ row: walletConnectionsCollection }).select(({ row }) => ({ row }))
	)

	/* infinite loop
	const walletsLiveQueryEntries = $derived([
		{ id: 'wallets', label: 'Wallets', query: walletsQuery },
		{ id: 'wallet-connections', label: 'Connections', query: connectionsQuery },
	])
	const walletsLiveQuery = liveQueryAttachmentFrom(() => walletsLiveQueryEntries)
	*/

	const settings = $derived(
		bridgeSettingsState.current ?? defaultBridgeSettings
	)

	const connections = $derived(
		(connectionsQuery.data ?? [])
			.map((c) => c.row)
			.filter((c) => c?.$id?.wallet$id?.rdns)
	)

	const wallets = $derived(
		(walletsQuery.data ?? [])
			.map((w) => w.row)
			.filter((w) => w?.$id?.rdns)
	)

	const walletsByRdns = $derived(
		new Map(wallets.map((w) => [w.$id.rdns, w]))
	)

	const joinWallet = (c: WalletConnectionRow): ConnectedWallet | null => {
		const wallet = walletsByRdns.get(c.$id.wallet$id.rdns)
		return wallet ? { wallet, connection: c } : null
	}

	const connectedWalletsDerived = $derived<ConnectedWallet[]>(
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

	const connectedRdns = $derived(
		new Set(connections.map((c) => c.$id.wallet$id.rdns))
	)

	const availableWallets = $derived(
		wallets.filter((w) => !connectedRdns.has(w.$id.rdns))
	)

	const selectedConnection = $derived(
		connectedWalletsDerived.find((w) => w.connection.selected) ?? null
	)

	const selectedActorDerived = $derived(
		selectedConnection?.connection.activeActor ?? null
	)

	const selectedChainIdDerived = $derived(
		selectedConnection?.connection.chainId ?? null
	)

	const walletChips = $derived<(ConnectedWallet & { status: 'connected' | 'connecting' | 'error' })[]>([
		...connectedWalletsDerived.map((c) => ({ ...c, status: 'connected' as const })),
		...connectingWallets.map((c) => ({ ...c, status: 'connecting' as const })),
		...failedWallets.map((c) => ({ ...c, status: 'error' as const })),
	])


	// Props
	let {
		connectedWallets = $bindable([] as ConnectedWallet[]),
		selectedActor = $bindable(null as `0x${string}` | null),
		selectedChainId = $bindable(null as number | null),
	}: {
		connectedWallets?: ConnectedWallet[]
		selectedActor?: `0x${string}` | null
		selectedChainId?: number | null,
	} = $props()

	$effect(() => {
		connectedWallets = connectedWalletsDerived
		selectedActor = selectedActorDerived
		selectedChainId = selectedChainIdDerived
	})


	// Actions
	const connect = (rdns: string) => (requestWalletConnection({ rdns }).catch(() => {}))
	const toggleTestnet = (checked: boolean) => (
		bridgeSettingsState.current = { ...settings, isTestnet: checked }
	)

	// Components
	import Address from '$/components/Address.svelte'
	import { Button, DropdownMenu, Switch, ToggleGroup } from 'bits-ui'
</script>


<label data-row="gap-2" role="group" aria-label="Network type">
		<Switch.Root
		checked={settings.isTestnet}
		onCheckedChange={(c) => toggleTestnet(c ?? false)}
		aria-label="Mainnets / Testnets"
		data-wallet-network-testnet={!settings.isTestnet}
		data-wallet-network-mainnet={settings.isTestnet}
	>
		<Switch.Thumb />
	</Switch.Root>
	<span data-wallet-network-label>{settings.isTestnet ? 'Testnet' : 'Mainnet'}</span>
</label>

<div data-row>
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
							<span data-wallet-address>
								<Address
									network={selectedChainIdDerived ?? 1}
									address={connection.activeActor}
									linked={false}
								/>
							</span>
						{:else}
							—
						{/if}
						<DropdownMenu.Root>
							<DropdownMenu.Trigger data-wallet-menu-trigger onclick={(e: MouseEvent) => e.stopPropagation()}>
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
															network={selectedChainIdDerived ?? 1}
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
									<DropdownMenu.Item data-wallet-disconnect onclick={() => disconnectWallet(wallet.$id)}>
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
									network={connection.chainId ?? selectedChainIdDerived ?? 1}
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

	{#if availableWallets.length > 0 || wallets.length === 0}
		<DropdownMenu.Root>
			<DropdownMenu.Trigger data-wallet-connect-trigger>
				Connect Wallet
			</DropdownMenu.Trigger>
			<DropdownMenu.Portal>
				<DropdownMenu.Content data-wallet-popover>
					{#if availableWallets.length > 0}
						{#each availableWallets as w (w.$id.rdns)}
							<DropdownMenu.Item data-wallet-provider-option onclick={() => connect(w.$id.rdns)}>
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
					{:else}
						<span data-wallet-empty>No wallets found</span>
					{/if}
				</DropdownMenu.Content>
			</DropdownMenu.Portal>
		</DropdownMenu.Root>
	{/if}
</div>


<style>
	[data-tag][data-connecting],
	[data-tag][data-failed] {
		opacity: 0.7;
		cursor: default;
	}
</style>
