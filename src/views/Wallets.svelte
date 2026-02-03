<script lang="ts">
	// Types/constants
	import type {
		ConnectedWallet,
		ReadOnlyWalletRow,
		WalletConnectionRow,
	} from '$/collections/wallet-connections'
	import { WalletConnectionTransport } from '$/data/WalletConnection'
	import {
		NetworkType,
		networks,
		networksByChainId,
	} from '$/constants/networks'
	import { DataSource } from '$/constants/data-sources'

	// Context
	import { useLiveQuery, eq } from '@tanstack/svelte-db'
	import { liveQueryAttachmentFrom } from '$/svelte/live-query-context.svelte'
	import { useWalletSubscriptions } from '$/state/wallet.svelte'

	import {
		walletConnectionsCollection,
		requestWalletConnection,
		switchActiveActor,
		selectConnection,
		setSelectedConnections,
		disconnectWallet,
		connectReadOnly,
	} from '$/collections/wallet-connections'
	import type { WalletRow } from '$/collections/wallets'
	import { walletsCollection } from '$/collections/wallets'
	import {
		bridgeSettingsState,
		defaultBridgeSettings,
	} from '$/state/bridge-settings.svelte'
	import {
		swapSettingsState,
		defaultSwapSettings,
	} from '$/state/swap-settings.svelte'
	import { switchWalletChain } from '$/lib/wallet'

	useWalletSubscriptions()

	const walletsQuery = useLiveQuery((q) =>
		q
			.from({ row: walletsCollection })
			.where(({ row }) => eq(row.$source, DataSource.Local))
			.select(({ row }) => ({ row })),
	)

	const connectionsQuery = useLiveQuery((q) =>
		q
			.from({ row: walletConnectionsCollection })
			.where(({ row }) => eq(row.$source, DataSource.Local))
			.select(({ row }) => ({ row })),
	)

	/* infinite loop
	const walletsLiveQueryEntries = $derived([
		{ id: 'wallets', label: 'Wallets', query: walletsQuery },
		{ id: 'wallet-connections', label: 'Connections', query: connectionsQuery },
	])
	const walletsLiveQuery = liveQueryAttachmentFrom(() => walletsLiveQueryEntries)
	*/

	const settings = $derived(
		bridgeSettingsState.current ?? defaultBridgeSettings,
	)
	const swapSettings = $derived(
		swapSettingsState.current ?? defaultSwapSettings,
	)

	const connections = $derived(
		(connectionsQuery.data ?? [])
			.map((c) => c.row)
			.filter((c) => c?.$id?.wallet$id?.rdns),
	)

	const wallets = $derived(
		(walletsQuery.data ?? [])
			.map((w) => w.row)
			.filter((w): w is WalletRow => !!w?.$id?.rdns),
	)

	const walletsByRdns = $derived(new Map(wallets.map((w) => [w.$id.rdns, w])))

	const joinWallet = (c: WalletConnectionRow): ConnectedWallet | null =>
		c.transport === WalletConnectionTransport.None
			? {
					wallet: {
						$id: c.$id.wallet$id,
						name: 'Read-only',
						icon: '',
						rdns: c.$id.wallet$id.rdns,
					},
					connection: c,
				}
			: ((wallet) => (wallet ? { wallet, connection: c } : null))(
					walletsByRdns.get(c.$id.wallet$id.rdns),
				)

	const connectedWalletsDerived = $derived<ConnectedWallet[]>(
		connections
			.filter((c) => c.status === 'connected')
			.map(joinWallet)
			.filter((w): w is ConnectedWallet => w !== null),
	)

	const connectingWallets = $derived<ConnectedWallet[]>(
		connections
			.filter((c) => c.status === 'connecting')
			.map(joinWallet)
			.filter((w): w is ConnectedWallet => w !== null),
	)

	const failedWallets = $derived<ConnectedWallet[]>(
		connections
			.filter((c) => c.status === 'error')
			.map(joinWallet)
			.filter((w): w is ConnectedWallet => w !== null),
	)

	const connectedRdns = $derived(
		new Set(connections.map((c) => c.$id.wallet$id.rdns)),
	)

	const availableWallets = $derived(
		wallets.filter((w) => !connectedRdns.has(w.$id.rdns)),
	)

	const selectedConnection = $derived(
		connectedWalletsDerived.find((w) => w.connection.selected) ?? null,
	)
	const selectedRdns = $derived(
		connectedWalletsDerived
			.filter((w) => w.connection.selected)
			.map((w) => w.wallet.$id.rdns),
	)

	const selectedActorDerived = $derived(
		selectedConnection?.connection.activeActor ?? null,
	)

	const selectedChainIdDerived = $derived(
		selectedConnection?.connection.chainId ?? null,
	)

	const filteredNetworks = $derived(
		networks.filter((n) =>
			settings.isTestnet
				? n.type === NetworkType.Testnet
				: n.type === NetworkType.Mainnet,
		),
	)

	$effect(() => {
		const nextChainId = filteredNetworks[0]?.id
		if (!nextChainId) return
		if (
			settings.fromChainId &&
			filteredNetworks.some((n) => n.id === settings.fromChainId)
		)
			return
		if (settings.fromChainId !== nextChainId)
			bridgeSettingsState.current = { ...settings, fromChainId: nextChainId }
		if (swapSettings.chainId !== nextChainId)
			swapSettingsState.current = { ...swapSettings, chainId: nextChainId }
	})

	const walletChips = $derived<
		(ConnectedWallet & { status: 'connected' | 'connecting' | 'error' })[]
	>([
		...connectedWalletsDerived.map((c) => ({
			...c,
			status: 'connected' as const,
		})),
		...connectingWallets.map((c) => ({ ...c, status: 'connecting' as const })),
		...failedWallets.map((c) => ({ ...c, status: 'error' as const })),
	])
	const eip1193WalletChips = $derived(
		walletChips.filter(
			(chip) => chip.connection.transport === WalletConnectionTransport.Eip1193,
		),
	)
	const readOnlyWalletChips = $derived(
		walletChips.filter(
			(chip) => chip.connection.transport === WalletConnectionTransport.None,
		),
	)

	let readOnlyAddress = $state('')

	// Props
	let {
		connectedWallets = $bindable([] as ConnectedWallet[]),
		selectedActor = $bindable(null as `0x${string}` | null),
		selectedChainId = $bindable(null as number | null),
		selectionMode = 'single' as 'single' | 'multiple',
	}: {
		connectedWallets?: ConnectedWallet[]
		selectedActor?: `0x${string}` | null
		selectedChainId?: number | null
		selectionMode?: 'single' | 'multiple'
	} = $props()

	$effect(() => {
		connectedWallets = connectedWalletsDerived
		selectedActor = selectedActorDerived
		selectedChainId = selectedChainIdDerived
	})

	// Actions
	const connect = (rdns: string) =>
		requestWalletConnection({ rdns }).catch(() => {})
	const toggleTestnet = (checked: boolean) =>
		(bridgeSettingsState.current = { ...settings, isTestnet: checked })
	const selectNetwork = (chainId: number) => {
		if (settings.fromChainId !== chainId)
			bridgeSettingsState.current = { ...settings, fromChainId: chainId }
		if (swapSettings.chainId !== chainId)
			swapSettingsState.current = { ...swapSettings, chainId }
	}
	const onNetworkValueChange = (value: number | number[] | null) =>
		typeof value === 'number' ? selectNetwork(value) : undefined
	const onSingleSelectionChange = (value: string | null) => {
		if (value) selectConnection({ rdns: value })
	}
	const onMultipleSelectionChange = (value: string[] | null) =>
		setSelectedConnections(new Set(value ?? []))
	const onReadOnlyInput = (
		event: Event & { currentTarget: HTMLInputElement },
	) => (readOnlyAddress = event.currentTarget.value)
	const switchNetwork = (
		connection: WalletConnectionRow,
		wallet: WalletRow | ReadOnlyWalletRow,
		chainId: number,
	) =>
		connection.transport === WalletConnectionTransport.Eip1193 &&
		'provider' in wallet
			? switchWalletChain(wallet.provider, chainId)
			: Promise.resolve()
	const connectReadOnlyAddress = () => {
		const nextChainId = settings.fromChainId
		if (!nextChainId) return
		if (
			connectReadOnly({ address: readOnlyAddress.trim(), chainId: nextChainId })
		) {
			readOnlyAddress = ''
		}
	}

	// Components
	import Address from '$/components/Address.svelte'
	import Icon from '$/components/Icon.svelte'
	import NetworkInput from '$/views/NetworkInput.svelte'
	import { Button, DropdownMenu, Switch, ToggleGroup } from 'bits-ui'
</script>

<div
	data-row="gap-2 align-center wrap"
	role="group"
	aria-label="Network settings"
>
	<label data-row="gap-2" aria-label="Network type">
		<Switch.Root
			checked={settings.isTestnet}
			onCheckedChange={(c) => toggleTestnet(c ?? false)}
			aria-label="Mainnets / Testnets"
			data-wallet-network-testnet={!settings.isTestnet}
			data-wallet-network-mainnet={settings.isTestnet}
		>
			<Switch.Thumb />
		</Switch.Root>
		<span data-wallet-network-label
			>{settings.isTestnet ? 'Testnet' : 'Mainnet'}</span
		>
	</label>
	<div data-row-item="flexible">
		<NetworkInput
			networks={filteredNetworks}
			value={settings.fromChainId}
			onValueChange={onNetworkValueChange}
			placeholder="Select network"
			ariaLabel="Network"
		/>
	</div>
</div>

<div data-row>
	{#if walletChips.length > 0}
		{#if eip1193WalletChips.length > 0}
			<div class="wallet-section">
				<h3 class="wallet-section-title">Wallets</h3>
				{#if selectionMode === 'single'}
					<ToggleGroup.Root
						type="single"
						value={selectedConnection?.wallet.$id.rdns ?? ''}
						onValueChange={onSingleSelectionChange}
						data-row="wrap gap-2"
					>
						{#each eip1193WalletChips as { wallet, connection, status } (wallet.$id.rdns)}
							{@const isConnected = status === 'connected'}
							{@const isReadOnly =
								connection.transport === WalletConnectionTransport.None}
							{@const statusLabel =
								status === 'connecting'
									? connection.activeActor
										? 'Reconnecting'
										: 'Connecting…'
									: status === 'error'
										? 'Locked'
										: null}
							{@const chainId = connection.chainId}
							{@const networkName = chainId
								? (networksByChainId[chainId]?.name ?? `Chain ${chainId}`)
								: null}
							{@const networkIconSrc = chainId
								? `/networks/${chainId}.svg`
								: null}
							{@const walletChipClass =
								status === 'connecting'
									? 'wallet-chip wallet-connecting'
									: status === 'error'
										? 'wallet-chip wallet-failed'
										: 'wallet-chip'}
							<ToggleGroup.Item
								value={wallet.$id.rdns}
								data-tag="wallet-type"
								data-connecting={status === 'connecting'}
								data-failed={status === 'error'}
								disabled={!isConnected}
								aria-disabled={!isConnected}
								class="wallet-connection-item"
							>
								<span class={walletChipClass}>
									{#if wallet.icon}
										<Icon
											src={wallet.icon}
											alt=""
											size={16}
											loading="lazy"
											decoding="async"
										/>
									{/if}
									{#if networkIconSrc}
										<Icon
											src={networkIconSrc}
											alt=""
											size={16}
											loading="lazy"
											decoding="async"
											class="wallet-network-icon"
											title={networkName ?? 'Unknown network'}
										/>
									{/if}
									<span class="wallet-details">
										{#if connection.activeActor}
											<span data-wallet-address>
												<Address
													network={chainId ?? selectedChainIdDerived ?? 1}
													address={connection.activeActor}
													linked={false}
												/>
											</span>
											{#if statusLabel}
												<span class="wallet-status">{statusLabel}</span>
											{/if}
										{:else}
											<span class="wallet-status">{statusLabel ?? '—'}</span>
										{/if}
									</span>
									{#if isConnected && connection.transport === WalletConnectionTransport.Eip1193}
										<DropdownMenu.Root>
											<DropdownMenu.Trigger
												data-wallet-menu-trigger
												onclick={(e: MouseEvent) => e.stopPropagation()}
											>
												<svg
													width="12"
													height="12"
													viewBox="0 0 12 12"
													fill="currentColor"
												>
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
																Switch Account
															</DropdownMenu.SubTrigger>
															<DropdownMenu.SubContent>
																{#each connection.actors ?? [] as actor (actor)}
																	<DropdownMenu.Item
																		onclick={() =>
																			switchActiveActor(wallet.$id, actor)}
																	>
																		<span class="wallet-menu-option">
																			<Address
																				network={chainId ??
																					selectedChainIdDerived ??
																					1}
																				address={actor}
																				linked={false}
																			/>
																		</span>
																	</DropdownMenu.Item>
																{/each}
															</DropdownMenu.SubContent>
														</DropdownMenu.Sub>
														<DropdownMenu.Separator />
													{/if}
													{#if filteredNetworks.length > 0}
														<DropdownMenu.Sub>
															<DropdownMenu.SubTrigger>
																Switch Network
															</DropdownMenu.SubTrigger>
															<DropdownMenu.SubContent>
																{#each filteredNetworks as network (network.id)}
																	<DropdownMenu.Item
																		onclick={() =>
																			switchNetwork(
																				connection,
																				wallet,
																				network.id,
																			).catch(() => {})}
																	>
																		<span class="wallet-menu-option">
																		<Icon
																			src={`/networks/${network.id}.svg`}
																			alt=""
																			size={16}
																			loading="lazy"
																			decoding="async"
																			class="wallet-network-icon"
																		/>
																			<span>{network.name}</span>
																		</span>
																	</DropdownMenu.Item>
																{/each}
															</DropdownMenu.SubContent>
														</DropdownMenu.Sub>
														<DropdownMenu.Separator />
													{/if}
													<DropdownMenu.Item
														data-wallet-disconnect
														onclick={() => disconnectWallet(wallet.$id)}
													>
														Disconnect
													</DropdownMenu.Item>
												</DropdownMenu.Content>
											</DropdownMenu.Portal>
										</DropdownMenu.Root>
									{:else if connection.transport === WalletConnectionTransport.None}
										<DropdownMenu.Root>
											<DropdownMenu.Trigger
												data-wallet-menu-trigger
												onclick={(e: MouseEvent) => e.stopPropagation()}
											>
												<svg
													width="12"
													height="12"
													viewBox="0 0 12 12"
													fill="currentColor"
												>
													<circle cx="6" cy="2" r="1.5" />
													<circle cx="6" cy="6" r="1.5" />
													<circle cx="6" cy="10" r="1.5" />
												</svg>
											</DropdownMenu.Trigger>
											<DropdownMenu.Portal>
												<DropdownMenu.Content>
													<DropdownMenu.Item
														data-wallet-disconnect
														onclick={() => disconnectWallet(wallet.$id)}
													>
														Remove
													</DropdownMenu.Item>
												</DropdownMenu.Content>
											</DropdownMenu.Portal>
										</DropdownMenu.Root>
									{:else}
										<Button.Root
											type="button"
											onclick={() => disconnectWallet(wallet.$id)}
										>
											×
										</Button.Root>
									{/if}
								</span>
							</ToggleGroup.Item>
						{/each}
					</ToggleGroup.Root>
				{:else}
					<ToggleGroup.Root
						type="multiple"
						value={selectedRdns}
						onValueChange={onMultipleSelectionChange}
						data-row="wrap gap-2"
					>
						{#each eip1193WalletChips as { wallet, connection, status } (wallet.$id.rdns)}
							{@const isConnected = status === 'connected'}
							{@const isReadOnly =
								connection.transport === WalletConnectionTransport.None}
							{@const statusLabel =
								status === 'connecting'
									? connection.activeActor
										? 'Reconnecting'
										: 'Connecting…'
									: status === 'error'
										? 'Locked'
										: null}
							{@const chainId = connection.chainId}
							{@const networkName = chainId
								? (networksByChainId[chainId]?.name ?? `Chain ${chainId}`)
								: null}
							{@const networkIconSrc = chainId
								? `/networks/${chainId}.svg`
								: null}
							{@const walletChipClass =
								status === 'connecting'
									? 'wallet-chip wallet-connecting'
									: status === 'error'
										? 'wallet-chip wallet-failed'
										: 'wallet-chip'}
							<ToggleGroup.Item
								value={wallet.$id.rdns}
								data-tag="wallet-type"
								data-connecting={status === 'connecting'}
								data-failed={status === 'error'}
								disabled={!isConnected}
								aria-disabled={!isConnected}
								class="wallet-connection-item"
							>
								<span class={walletChipClass}>
									{#if wallet.icon}
										<Icon
											src={wallet.icon}
											alt=""
											size={16}
											loading="lazy"
											decoding="async"
										/>
									{/if}
									{#if networkIconSrc}
										<Icon
											src={networkIconSrc}
											alt=""
											size={16}
											loading="lazy"
											decoding="async"
											class="wallet-network-icon"
											title={networkName ?? 'Unknown network'}
										/>
									{/if}
									<span class="wallet-details">
										{#if connection.activeActor}
											<span data-wallet-address>
												<Address
													network={chainId ?? selectedChainIdDerived ?? 1}
													address={connection.activeActor}
													linked={false}
												/>
											</span>
											{#if statusLabel}
												<span class="wallet-status">{statusLabel}</span>
											{/if}
										{:else}
											<span class="wallet-status">{statusLabel ?? '—'}</span>
										{/if}
									</span>
									{#if isConnected && connection.transport === WalletConnectionTransport.Eip1193}
										<DropdownMenu.Root>
											<DropdownMenu.Trigger
												data-wallet-menu-trigger
												onclick={(e: MouseEvent) => e.stopPropagation()}
											>
												<svg
													width="12"
													height="12"
													viewBox="0 0 12 12"
													fill="currentColor"
												>
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
																Switch Account
															</DropdownMenu.SubTrigger>
															<DropdownMenu.SubContent>
																{#each connection.actors ?? [] as actor (actor)}
																	<DropdownMenu.Item
																		onclick={() =>
																			switchActiveActor(wallet.$id, actor)}
																	>
																		<span class="wallet-menu-option">
																			<Address
																				network={chainId ??
																					selectedChainIdDerived ??
																					1}
																				address={actor}
																				linked={false}
																			/>
																		</span>
																	</DropdownMenu.Item>
																{/each}
															</DropdownMenu.SubContent>
														</DropdownMenu.Sub>
														<DropdownMenu.Separator />
													{/if}
													{#if filteredNetworks.length > 0}
														<DropdownMenu.Sub>
															<DropdownMenu.SubTrigger>
																Switch Network
															</DropdownMenu.SubTrigger>
															<DropdownMenu.SubContent>
																{#each filteredNetworks as network (network.id)}
																	<DropdownMenu.Item
																		onclick={() =>
																			switchNetwork(
																				connection,
																				wallet,
																				network.id,
																			).catch(() => {})}
																	>
																		<span class="wallet-menu-option">
																		<Icon
																			src={`/networks/${network.id}.svg`}
																			alt=""
																			size={16}
																			loading="lazy"
																			decoding="async"
																			class="wallet-network-icon"
																		/>
																			<span>{network.name}</span>
																		</span>
																	</DropdownMenu.Item>
																{/each}
															</DropdownMenu.SubContent>
														</DropdownMenu.Sub>
														<DropdownMenu.Separator />
													{/if}
													<DropdownMenu.Item
														data-wallet-disconnect
														onclick={() => disconnectWallet(wallet.$id)}
													>
														Disconnect
													</DropdownMenu.Item>
												</DropdownMenu.Content>
											</DropdownMenu.Portal>
										</DropdownMenu.Root>
									{:else if connection.transport === WalletConnectionTransport.None}
										<DropdownMenu.Root>
											<DropdownMenu.Trigger
												data-wallet-menu-trigger
												onclick={(e: MouseEvent) => e.stopPropagation()}
											>
												<svg
													width="12"
													height="12"
													viewBox="0 0 12 12"
													fill="currentColor"
												>
													<circle cx="6" cy="2" r="1.5" />
													<circle cx="6" cy="6" r="1.5" />
													<circle cx="6" cy="10" r="1.5" />
												</svg>
											</DropdownMenu.Trigger>
											<DropdownMenu.Portal>
												<DropdownMenu.Content>
													<DropdownMenu.Item
														data-wallet-disconnect
														onclick={() => disconnectWallet(wallet.$id)}
													>
														Remove
													</DropdownMenu.Item>
												</DropdownMenu.Content>
											</DropdownMenu.Portal>
										</DropdownMenu.Root>
									{:else}
										<Button.Root
											type="button"
											onclick={() => disconnectWallet(wallet.$id)}
										>
											×
										</Button.Root>
									{/if}
								</span>
							</ToggleGroup.Item>
						{/each}
					</ToggleGroup.Root>
				{/if}
			</div>
		{/if}

		{#if readOnlyWalletChips.length > 0}
			<div class="wallet-section">
				<h3 class="wallet-section-title">Read-only</h3>
				{#if selectionMode === 'single'}
					<ToggleGroup.Root
						type="single"
						value={selectedConnection?.wallet.$id.rdns ?? ''}
						onValueChange={onSingleSelectionChange}
						data-row="wrap gap-2"
					>
						{#each readOnlyWalletChips as { wallet, connection, status } (wallet.$id.rdns)}
							{@const isConnected = status === 'connected'}
							{@const isReadOnly =
								connection.transport === WalletConnectionTransport.None}
							{@const statusLabel =
								status === 'connecting'
									? connection.activeActor
										? 'Reconnecting'
										: 'Connecting…'
									: status === 'error'
										? 'Locked'
										: null}
							{@const chainId = connection.chainId}
							{@const networkName = chainId
								? (networksByChainId[chainId]?.name ?? `Chain ${chainId}`)
								: null}
							{@const networkIconSrc = chainId
								? `/networks/${chainId}.svg`
								: null}
							{@const walletChipClass =
								status === 'connecting'
									? 'wallet-chip wallet-connecting'
									: status === 'error'
										? 'wallet-chip wallet-failed'
										: 'wallet-chip'}
							<ToggleGroup.Item
								value={wallet.$id.rdns}
								data-tag="wallet-type"
								data-connecting={status === 'connecting'}
								data-failed={status === 'error'}
								disabled={!isConnected}
								aria-disabled={!isConnected}
								class="wallet-connection-item"
							>
								<span class={walletChipClass}>
									{#if wallet.icon}
										<Icon
											src={wallet.icon}
											alt=""
											size={16}
											loading="lazy"
											decoding="async"
										/>
									{/if}
									{#if networkIconSrc}
										<Icon
											src={networkIconSrc}
											alt=""
											size={16}
											loading="lazy"
											decoding="async"
											class="wallet-network-icon"
											title={networkName ?? 'Unknown network'}
										/>
									{/if}
									<span class="wallet-details">
										{#if connection.activeActor}
											<span data-wallet-address>
												<Address
													network={chainId ?? selectedChainIdDerived ?? 1}
													address={connection.activeActor}
													linked={false}
												/>
											</span>
											{#if statusLabel}
												<span class="wallet-status">{statusLabel}</span>
											{/if}
										{:else}
											<span class="wallet-status">{statusLabel ?? '—'}</span>
										{/if}
									</span>
									{#if isConnected && connection.transport === WalletConnectionTransport.Eip1193}
										<DropdownMenu.Root>
											<DropdownMenu.Trigger
												data-wallet-menu-trigger
												onclick={(e: MouseEvent) => e.stopPropagation()}
											>
												<svg
													width="12"
													height="12"
													viewBox="0 0 12 12"
													fill="currentColor"
												>
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
																Switch Account
															</DropdownMenu.SubTrigger>
															<DropdownMenu.SubContent>
																{#each connection.actors ?? [] as actor (actor)}
																	<DropdownMenu.Item
																		onclick={() =>
																			switchActiveActor(wallet.$id, actor)}
																	>
																		<span class="wallet-menu-option">
																			<Address
																				network={chainId ??
																					selectedChainIdDerived ??
																					1}
																				address={actor}
																				linked={false}
																			/>
																		</span>
																	</DropdownMenu.Item>
																{/each}
															</DropdownMenu.SubContent>
														</DropdownMenu.Sub>
														<DropdownMenu.Separator />
													{/if}
													{#if filteredNetworks.length > 0}
														<DropdownMenu.Sub>
															<DropdownMenu.SubTrigger>
																Switch Network
															</DropdownMenu.SubTrigger>
															<DropdownMenu.SubContent>
																{#each filteredNetworks as network (network.id)}
																	<DropdownMenu.Item
																		onclick={() =>
																			switchNetwork(
																				connection,
																				wallet,
																				network.id,
																			).catch(() => {})}
																	>
																		<span class="wallet-menu-option">
																		<Icon
																			src={`/networks/${network.id}.svg`}
																			alt=""
																			size={16}
																			loading="lazy"
																			decoding="async"
																			class="wallet-network-icon"
																		/>
																			<span>{network.name}</span>
																		</span>
																	</DropdownMenu.Item>
																{/each}
															</DropdownMenu.SubContent>
														</DropdownMenu.Sub>
														<DropdownMenu.Separator />
													{/if}
													<DropdownMenu.Item
														data-wallet-disconnect
														onclick={() => disconnectWallet(wallet.$id)}
													>
														Disconnect
													</DropdownMenu.Item>
												</DropdownMenu.Content>
											</DropdownMenu.Portal>
										</DropdownMenu.Root>
									{:else if connection.transport === WalletConnectionTransport.None}
										<DropdownMenu.Root>
											<DropdownMenu.Trigger
												data-wallet-menu-trigger
												onclick={(e: MouseEvent) => e.stopPropagation()}
											>
												<svg
													width="12"
													height="12"
													viewBox="0 0 12 12"
													fill="currentColor"
												>
													<circle cx="6" cy="2" r="1.5" />
													<circle cx="6" cy="6" r="1.5" />
													<circle cx="6" cy="10" r="1.5" />
												</svg>
											</DropdownMenu.Trigger>
											<DropdownMenu.Portal>
												<DropdownMenu.Content>
													<DropdownMenu.Item
														data-wallet-disconnect
														onclick={() => disconnectWallet(wallet.$id)}
													>
														Remove
													</DropdownMenu.Item>
												</DropdownMenu.Content>
											</DropdownMenu.Portal>
										</DropdownMenu.Root>
									{:else}
										<Button.Root
											type="button"
											onclick={() => disconnectWallet(wallet.$id)}
										>
											×
										</Button.Root>
									{/if}
								</span>
							</ToggleGroup.Item>
						{/each}
					</ToggleGroup.Root>
				{:else}
					<ToggleGroup.Root
						type="multiple"
						value={selectedRdns}
						onValueChange={onMultipleSelectionChange}
						data-row="wrap gap-2"
					>
						{#each readOnlyWalletChips as { wallet, connection, status } (wallet.$id.rdns)}
							{@const isConnected = status === 'connected'}
							{@const isReadOnly =
								connection.transport === WalletConnectionTransport.None}
							{@const statusLabel =
								status === 'connecting'
									? connection.activeActor
										? 'Reconnecting'
										: 'Connecting…'
									: status === 'error'
										? 'Locked'
										: null}
							{@const chainId = connection.chainId}
							{@const networkName = chainId
								? (networksByChainId[chainId]?.name ?? `Chain ${chainId}`)
								: null}
							{@const networkIconSrc = chainId
								? `/networks/${chainId}.svg`
								: null}
							{@const walletChipClass =
								status === 'connecting'
									? 'wallet-chip wallet-connecting'
									: status === 'error'
										? 'wallet-chip wallet-failed'
										: 'wallet-chip'}
							<ToggleGroup.Item
								value={wallet.$id.rdns}
								data-tag="wallet-type"
								data-connecting={status === 'connecting'}
								data-failed={status === 'error'}
								disabled={!isConnected}
								aria-disabled={!isConnected}
								class="wallet-connection-item"
							>
								<span class={walletChipClass}>
									{#if wallet.icon}
										<Icon
											src={wallet.icon}
											alt=""
											size={16}
											loading="lazy"
											decoding="async"
										/>
									{/if}
									{#if networkIconSrc}
										<Icon
											src={networkIconSrc}
											alt=""
											size={16}
											loading="lazy"
											decoding="async"
											class="wallet-network-icon"
											title={networkName ?? 'Unknown network'}
										/>
									{/if}
									<span class="wallet-details">
										{#if connection.activeActor}
											<span data-wallet-address>
												<Address
													network={chainId ?? selectedChainIdDerived ?? 1}
													address={connection.activeActor}
													linked={false}
												/>
											</span>
											{#if statusLabel}
												<span class="wallet-status">{statusLabel}</span>
											{/if}
										{:else}
											<span class="wallet-status">{statusLabel ?? '—'}</span>
										{/if}
									</span>
									{#if isConnected && connection.transport === WalletConnectionTransport.Eip1193}
										<DropdownMenu.Root>
											<DropdownMenu.Trigger
												data-wallet-menu-trigger
												onclick={(e: MouseEvent) => e.stopPropagation()}
											>
												<svg
													width="12"
													height="12"
													viewBox="0 0 12 12"
													fill="currentColor"
												>
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
																Switch Account
															</DropdownMenu.SubTrigger>
															<DropdownMenu.SubContent>
																{#each connection.actors ?? [] as actor (actor)}
																	<DropdownMenu.Item
																		onclick={() =>
																			switchActiveActor(wallet.$id, actor)}
																	>
																		<span class="wallet-menu-option">
																			<Address
																				network={chainId ??
																					selectedChainIdDerived ??
																					1}
																				address={actor}
																				linked={false}
																			/>
																		</span>
																	</DropdownMenu.Item>
																{/each}
															</DropdownMenu.SubContent>
														</DropdownMenu.Sub>
														<DropdownMenu.Separator />
													{/if}
													{#if filteredNetworks.length > 0}
														<DropdownMenu.Sub>
															<DropdownMenu.SubTrigger>
																Switch Network
															</DropdownMenu.SubTrigger>
															<DropdownMenu.SubContent>
																{#each filteredNetworks as network (network.id)}
																	<DropdownMenu.Item
																		onclick={() =>
																			switchNetwork(
																				connection,
																				wallet,
																				network.id,
																			).catch(() => {})}
																	>
																		<span class="wallet-menu-option">
																		<Icon
																			src={`/networks/${network.id}.svg`}
																			alt=""
																			size={16}
																			loading="lazy"
																			decoding="async"
																			class="wallet-network-icon"
																		/>
																			<span>{network.name}</span>
																		</span>
																	</DropdownMenu.Item>
																{/each}
															</DropdownMenu.SubContent>
														</DropdownMenu.Sub>
														<DropdownMenu.Separator />
													{/if}
													<DropdownMenu.Item
														data-wallet-disconnect
														onclick={() => disconnectWallet(wallet.$id)}
													>
														Disconnect
													</DropdownMenu.Item>
												</DropdownMenu.Content>
											</DropdownMenu.Portal>
										</DropdownMenu.Root>
									{:else if connection.transport === WalletConnectionTransport.None}
										<DropdownMenu.Root>
											<DropdownMenu.Trigger
												data-wallet-menu-trigger
												onclick={(e: MouseEvent) => e.stopPropagation()}
											>
												<svg
													width="12"
													height="12"
													viewBox="0 0 12 12"
													fill="currentColor"
												>
													<circle cx="6" cy="2" r="1.5" />
													<circle cx="6" cy="6" r="1.5" />
													<circle cx="6" cy="10" r="1.5" />
												</svg>
											</DropdownMenu.Trigger>
											<DropdownMenu.Portal>
												<DropdownMenu.Content>
													<DropdownMenu.Item
														data-wallet-disconnect
														onclick={() => disconnectWallet(wallet.$id)}
													>
														Remove
													</DropdownMenu.Item>
												</DropdownMenu.Content>
											</DropdownMenu.Portal>
										</DropdownMenu.Root>
									{:else}
										<Button.Root
											type="button"
											onclick={() => disconnectWallet(wallet.$id)}
										>
											×
										</Button.Root>
									{/if}
								</span>
							</ToggleGroup.Item>
						{/each}
					</ToggleGroup.Root>
				{/if}
			</div>
		{/if}
	{/if}

	<DropdownMenu.Root>
		<DropdownMenu.Trigger
			data-wallet-connect-trigger
			aria-label="Connect wallet"
		>
			{walletChips.length > 0 ? '+' : 'Connect Wallet'}
		</DropdownMenu.Trigger>
		<DropdownMenu.Portal>
			<DropdownMenu.Content data-wallet-popover>
				{#if availableWallets.length > 0}
					{#each availableWallets as w (w.$id.rdns)}
						<DropdownMenu.Item
							data-wallet-provider-option
							onclick={() => connect(w.$id.rdns)}
						>
							{#if w.icon}
								<Icon src={w.icon} alt="" size={20} loading="lazy" decoding="async" />
							{/if}
							<span>{w.name}</span>
						</DropdownMenu.Item>
					{/each}
				{:else}
					<span data-wallet-empty>No wallets found</span>
				{/if}
				<DropdownMenu.Separator />
				<form
					class="wallet-readonly"
					onsubmit={(event) => (
						event.preventDefault(),
						connectReadOnlyAddress()
					)}
				>
					<label class="wallet-readonly-label" for="read-only-wallet">
						Read-only address
					</label>
					<div class="wallet-readonly-field">
						<input
							id="read-only-wallet"
							name="read-only-wallet"
							type="text"
							placeholder="0x..."
							class="wallet-readonly-input"
							value={readOnlyAddress}
							oninput={onReadOnlyInput}
						/>
						<Button.Root type="submit">Add</Button.Root>
					</div>
				</form>
			</DropdownMenu.Content>
		</DropdownMenu.Portal>
	</DropdownMenu.Root>
</div>

<style>
	.wallet-chip {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		position: relative;

		&.wallet-connecting,
		&.wallet-failed {
			opacity: 0.7;
			cursor: default;
		}
	}

	.wallet-details {
		display: grid;
		gap: 0.1rem;
	}

	.wallet-status {
		font-size: 0.75em;
		opacity: 0.7;
	}

	.wallet-network-icon {
		border-radius: 9999px;
		box-shadow: 0 0 0 1px
			color-mix(in srgb, var(--color-border) 70%, transparent);
	}

	.wallet-menu-option {
		position: relative;
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		width: 100%;
		padding-inline-end: 1.75rem;
	}

	:global(.wallet-connection-item) {
		&[data-state='on'] {
			:global(.wallet-chip)::before {
				content: '✓';
				position: absolute;
				top: -0.2rem;
				right: -0.2rem;
				font-size: 0.55rem;
				line-height: 1;
				color: var(--color-on-accent, #fff);
				z-index: 1;
			}

			:global(.wallet-chip)::after {
				content: '';
				position: absolute;
				top: -0.3rem;
				right: -0.3rem;
				width: 0.85rem;
				height: 0.85rem;
				border-radius: 9999px;
				background-color: var(--color-accent, #6c24e0);
				box-shadow: 0 0 0 1px
					color-mix(in srgb, var(--color-accent) 70%, transparent);
			}
		}
	}

	.wallet-readonly {
		display: grid;
		gap: 0.5rem;
		padding: 0.5rem 0;
	}

	.wallet-readonly-label {
		font-size: 0.75rem;
		text-transform: uppercase;
		opacity: 0.7;
	}

	.wallet-readonly-field {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		gap: 0.5rem;
		align-items: center;
	}

	.wallet-readonly-input {
		padding: 0.35rem 0.5rem;
		border-radius: 0.4rem;
		border: 1px solid var(--color-border);
		background: var(--color-bg-page);
		color: inherit;
		font: inherit;
	}

	.wallet-section {
		display: grid;
		gap: 0.5rem;
	}

	.wallet-section-title {
		font-size: 0.75rem;
		text-transform: uppercase;
		opacity: 0.7;
	}
</style>
