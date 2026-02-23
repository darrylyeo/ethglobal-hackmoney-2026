<script lang="ts">
	// Types/constants
	import { dev } from '$app/environment'
	import type {
		ConnectedWallet,
		ReadOnlyWalletRow,
		WalletConnectionRow,
	} from '$/collections/WalletConnections.ts'
	import type {
		WalletConnectionEip1193,
		WalletConnectionNone,
	} from '$/data/WalletConnection.ts'
	import { WalletConnectionTransport } from '$/data/WalletConnection.ts'
	import { NetworkEnvironment } from '$/constants/network-environment.ts'
	import {
		mainnetForTestnet,
		NetworkType,
		networksByChainId,
		networks,
		testnetsForMainnet,
	} from '$/constants/networks.ts'
	import { stringify } from 'devalue'


	// Context
	import { useLiveQuery } from '@tanstack/svelte-db'
	import { useWalletSubscriptions } from '$/state/wallet.svelte.ts'
	import { registerLocalLiveQueryStack } from '$/svelte/live-query-context.svelte.ts'

	import {
		walletConnectionsCollection,
		requestWalletConnection,
		switchActiveActor,
		selectConnection,
		setSelectedConnections,
		disconnectWallet,
		connectReadOnly,
	} from '$/collections/WalletConnections.ts'
	import type { WalletRow } from '$/collections/Wallets.ts'
	type NetworkInfo = (typeof networks)[number]
	type WalletMenuItem = {
		kind: string
		label?: string
		actor?: `0x${string}`
		network?: NetworkInfo
	}
	const getWalletMenuEntries = (
		wallet: WalletRow | ReadOnlyWalletRow,
		connection: WalletConnectionEip1193 | WalletConnectionNone,
		status: 'connected' | 'connecting' | 'error',
	): WalletMenuEntry[] =>
		status !== 'connected'
			? [
					{
						type: 'item',
						item: { kind: 'unlock', label: 'Unlock' },
						id: `unlock-${wallet.$id.rdns}`,
						onSelect: () => connect(stringify(wallet.$id)),
					},
					{
						type: 'item',
						item: { kind: 'disconnect', label: 'Remove' },
						id: `disconnect-${wallet.$id.rdns}`,
						onSelect: () => disconnectWallet(wallet.$id),
					},
				]
			: connection.transport === WalletConnectionTransport.None
				? [
						{
							type: 'item',
							item: { kind: 'disconnect', label: 'Remove' },
							id: `disconnect-${wallet.$id.rdns}`,
							onSelect: () => disconnectWallet(wallet.$id),
						},
					]
				: [
						...((connection.actors ?? []).length > 0
							? [
									...(connection.actors ?? []).map((actor) => ({
										type: 'item',
										item: { kind: 'actor', actor },
										id: `actor-${actor}`,
										onSelect: () => switchActiveActor(wallet.$id, actor),
									})),
									{ type: 'separator' },
								]
							: []),
						...(filteredNetworks.length > 0
							? [
									...filteredNetworks.map((network) => ({
										type: 'item',
										item: { kind: 'network', network },
										id: `network-${network.id}`,
										onSelect: () =>
											switchNetwork(connection, wallet, network.id).catch(
												() => {},
											),
									})),
									{ type: 'separator' },
								]
							: []),
						{
							type: 'item',
							item: { kind: 'disconnect', label: 'Disconnect' },
							id: `disconnect-${wallet.$id.rdns}`,
							onSelect: () => disconnectWallet(wallet.$id),
						},
					]
	type WalletMenuEntry =
		| {
				type: string
				item: WalletMenuItem
				id?: string
				onSelect?: () => void
				disabled?: boolean
		  }
		| {
				type: string
				id?: string
		  }
	type WalletConnectItem = {
		kind: string
		label?: string
		wallet?: WalletRow
	}
	type WalletConnectEntry =
		| {
				type: string
				id?: string
				item: WalletConnectItem
				onSelect?: () => void
				disabled?: boolean
		  }
		| {
				type: string
				id?: string
		  }
	import { upsertWallet, walletsCollection } from '$/collections/Wallets.ts'
	import { networkEnvironmentState } from '$/state/network-environment.svelte.ts'
	import { switchWalletChain } from '$/lib/wallet.ts'

	useWalletSubscriptions()

	const walletsQuery = useLiveQuery((q) =>
		q.from({ row: walletsCollection }).select(({ row }) => ({ row })),
	)

	const connectionsQuery = useLiveQuery((q) =>
		q
			.from({ row: walletConnectionsCollection })
			.select(({ row }) => ({ row })),
	)

	const walletsLiveQueryEntries = [
		{ id: 'wallets-view-wallets', label: 'Wallets', query: walletsQuery },
		{
			id: 'wallets-view-connections',
			label: 'Connections',
			query: connectionsQuery,
		},
	]
	registerLocalLiveQueryStack(() => walletsLiveQueryEntries)

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

	$effect(() => {
		if (typeof window === 'undefined') return
		const e2eProvider = window.__E2E_TEVM_PROVIDER__
		if (
			!e2eProvider?.info?.rdns ||
			typeof e2eProvider.provider?.request !== 'function'
		)
			return
		upsertWallet({
			$id: { rdns: e2eProvider.info.rdns },
			name: e2eProvider.info.name ?? '',
			icon: e2eProvider.info.icon ?? '',
			rdns: e2eProvider.info.rdns ?? '',
			provider: e2eProvider.provider,
		})
		if (connections.some((c) => c.$id.wallet$id.rdns === e2eProvider.info.rdns))
			return
		requestWalletConnection({ rdns: e2eProvider.info.rdns }, true).catch(
			() => {},
		)
	})

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

	const networkEnvironment = $derived(
		networkEnvironmentState.current,
	)
	const filteredNetworks = $derived(
		networks.filter((n) =>
			networkEnvironment === NetworkEnvironment.Testnet
				? n.type === NetworkType.Testnet
				: n.type === NetworkType.Mainnet,
		),
	)

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
	const connect = (rdns: string) => {
		queueMicrotask(() => {
			requestWalletConnection({ rdns }).catch((e) => {
				if (dev && typeof console !== 'undefined' && console.error)
					console.error('[AccountsSelect] connect failed', rdns, e)
			})
		})
	}
	const onNetworkValueChange = (value: number | number[] | null) => {
		if (typeof value !== 'number') return
		selectedChainId = value
		const sel = selectedConnection
		if (sel)
			switchNetwork(sel.connection, sel.wallet, value).catch(() => {})
	}
	const onSingleSelectionChange = (value: string | null) => {
		if (!value) return
		const chip = eip1193WalletChips.find((c) => c.wallet.$id.rdns === value)
		if (chip?.status !== 'connected') return
		selectConnection({ rdns: value })
	}
	const onMultipleSelectionChange = (value: string[] | null) =>
		setSelectedConnections(new Set(value ?? []))
	const switchNetwork = (
		connection: WalletConnectionEip1193 | WalletConnectionNone,
		wallet: WalletRow | ReadOnlyWalletRow,
		chainId: number,
	) =>
		connection.transport === WalletConnectionTransport.Eip1193 &&
		'provider' in wallet
			? switchWalletChain(wallet.provider, chainId)
			: Promise.resolve()
	const connectReadOnlyAddress = () => {
		if (connectReadOnly({ address: readOnlyAddress.trim() })) {
			readOnlyAddress = ''
		}
	}


	// Components
	import Address from '$/views/Address.svelte'
	import Dropdown from '$/components/Dropdown.svelte'
	import Icon from '$/components/Icon.svelte'
	import NetworkIcon from '$/views/NetworkIcon.svelte'
	import NetworkInput from '$/views/NetworkInput.svelte'
	import { Button, ToggleGroup } from 'bits-ui'
</script>


<div
	data-row="align-center wrap"
	role="group"
	aria-label="Network settings"
>
	<div data-row-item="flexible">
		<NetworkInput
			networks={filteredNetworks}
			bind:value={() => selectedChainId, onNetworkValueChange}
			placeholder="Select network"
			ariaLabel="Network"
		/>
	</div>
</div>

<div data-row>
	{#if walletChips.length > 0}
		{#if eip1193WalletChips.length > 0}
			<div class="wallet-section" data-column>
				{#if selectionMode === 'single'}
					<ToggleGroup.Root
						type="single"
						bind:value={
							() => selectedConnection?.wallet.$id.rdns ?? '',
							onSingleSelectionChange
						}
						data-row="wrap"
					>
						{#each eip1193WalletChips as { wallet, connection, status } (stringify(wallet.$id))}
							{@const isConnected = status === 'connected'}
							{@const isReadOnly =
								connection.transport === WalletConnectionTransport.None}
							{@const statusLabel =
								status === 'connecting'
									? connection.activeActor
										? 'Reconnecting'
										: 'Connecting…'
									: status === 'error'
										? (connection.error ?? null)
										: null}
							{@const chainId = connection.chainId}
							{@const networkName = chainId
								? (networksByChainId[chainId]?.name ?? `Chain ${chainId}`)
								: null}
							{@const walletChipClass =
								status === 'connecting'
									? 'wallet-chip wallet-connecting'
									: status === 'error'
										? 'wallet-chip wallet-failed'
										: 'wallet-chip'}
							{@const walletMenuItems = getWalletMenuEntries(
								wallet,
								connection,
								status,
							)}
							<ToggleGroup.Item
								value={wallet.$id.rdns}
								data-tag="wallet-type"
								data-connecting={status === 'connecting'}
								data-failed={status === 'error'}
								class="wallet-connection-item"
							>
								<span class={walletChipClass} data-row="start gap-1">
									<NetworkIcon
										networkId={{ chainId: chainId ?? selectedChainIdDerived ?? 1 }}
										subicon={
											wallet.icon
												? { src: wallet.icon }
												: undefined
										}
										title={networkName ?? 'Unknown network'}
									/>
									<span class="wallet-details" data-column="gap-0">
										{#if connection.activeActor}
											<span data-wallet-address>
												<Address
													actorId={{ $network: { chainId: chainId ?? selectedChainIdDerived ?? 1 }, address: connection.activeActor }}
													isLinked={false}
												/>
											</span>
											{#if statusLabel}
												<span class="wallet-status">{statusLabel}</span>
											{/if}
										{:else}
											<span class="wallet-status">{statusLabel ?? '—'}</span>
										{/if}
									</span>
									<Dropdown
										items={walletMenuItems}
										triggerAriaLabel="Wallet menu"
										triggerProps={{
											'data-wallet-menu-trigger': true,
											onclick: (event: MouseEvent) => event.stopPropagation(),
										}}
									>
										{#snippet Trigger()}
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
										{/snippet}
										{#snippet Item(item)}
											{#if item.kind === 'actor'}
												<span class="wallet-menu-option" data-row="start">
													<Address
														actorId={{ $network: { chainId: chainId ?? selectedChainIdDerived ?? 1 }, address: item.actor }}
														isLinked={false}
													/>
												</span>
											{:else if item.kind === 'network'}
												<span class="wallet-menu-option" data-row="start">
													<NetworkIcon
														networkId={{ chainId: item.network.id }}
													/>
													<span>{item.network.name}</span>
												</span>
											{:else if item.kind === 'disconnect'}
												<span data-wallet-disconnect>{item.label}</span>
											{:else}
												{item.label}
											{/if}
										{/snippet}
									</Dropdown>
								</span>
							</ToggleGroup.Item>
						{/each}
					</ToggleGroup.Root>
				{:else}
					<ToggleGroup.Root
						type="multiple"
						bind:value={() => selectedRdns, onMultipleSelectionChange}
						data-row="wrap"
					>
						{#each eip1193WalletChips as { wallet, connection, status } (stringify(wallet.$id))}
							{@const isConnected = status === 'connected'}
							{@const isReadOnly =
								connection.transport === WalletConnectionTransport.None}
							{@const statusLabel =
								status === 'connecting'
									? connection.activeActor
										? 'Reconnecting'
										: 'Connecting…'
									: status === 'error'
										? (connection.error ?? null)
										: null}
							{@const chainId = connection.chainId}
							{@const networkName = chainId
								? (networksByChainId[chainId]?.name ?? `Chain ${chainId}`)
								: null}
							{@const walletChipClass =
								status === 'connecting'
									? 'wallet-chip wallet-connecting'
									: status === 'error'
										? 'wallet-chip wallet-failed'
										: 'wallet-chip'}
							{@const walletMenuItems = getWalletMenuEntries(
								wallet,
								connection,
								status,
							)}
							<ToggleGroup.Item
								value={wallet.$id.rdns}
								data-tag="wallet-type"
								data-connecting={status === 'connecting'}
								data-failed={status === 'error'}
								class="wallet-connection-item"
							>
								<span class={walletChipClass} data-row="start gap-1">
									<NetworkIcon
										networkId={{ chainId: chainId ?? selectedChainIdDerived ?? 1 }}
										subicon={
											wallet.icon
												? { src: wallet.icon }
												: undefined
										}
										title={networkName ?? 'Unknown network'}
									/>
									<span class="wallet-details" data-column="gap-0">
										{#if connection.activeActor}
											<span data-wallet-address>
												<Address
													actorId={{ $network: { chainId: chainId ?? selectedChainIdDerived ?? 1 }, address: connection.activeActor }}
													isLinked={false}
												/>
											</span>
											{#if statusLabel}
												<span class="wallet-status">{statusLabel}</span>
											{/if}
										{:else}
											<span class="wallet-status">{statusLabel ?? '—'}</span>
										{/if}
									</span>
									<Dropdown
										items={walletMenuItems}
										triggerAriaLabel="Wallet menu"
										triggerProps={{
											'data-wallet-menu-trigger': true,
											onclick: (event: MouseEvent) => event.stopPropagation(),
										}}
									>
										{#snippet Trigger()}
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
										{/snippet}
										{#snippet Item(item)}
											{#if item.kind === 'actor'}
												<span class="wallet-menu-option" data-row="start">
													<Address
														actorId={{ $network: { chainId: chainId ?? selectedChainIdDerived ?? 1 }, address: item.actor }}
														isLinked={false}
													/>
												</span>
											{:else if item.kind === 'network'}
												<span class="wallet-menu-option" data-row="start">
													<NetworkIcon
														networkId={{ chainId: item.network.id }}
													/>
													<span>{item.network.name}</span>
												</span>
											{:else if item.kind === 'disconnect'}
												<span data-wallet-disconnect>{item.label}</span>
											{:else}
												{item.label}
											{/if}
										{/snippet}
									</Dropdown>
								</span>
							</ToggleGroup.Item>
						{/each}
					</ToggleGroup.Root>
				{/if}
			</div>
		{/if}

		{#if readOnlyWalletChips.length > 0}
			<div class="wallet-section" data-column>
				{#if selectionMode === 'single'}
					<ToggleGroup.Root
						type="single"
						bind:value={
							() => selectedConnection?.wallet.$id.rdns ?? '',
							onSingleSelectionChange
						}
						data-row="wrap"
					>
						{#each readOnlyWalletChips as { wallet, connection, status } (stringify(wallet.$id))}
							{@const isConnected = status === 'connected'}
							{@const isReadOnly =
								connection.transport === WalletConnectionTransport.None}
							{@const statusLabel =
								status === 'connecting'
									? connection.activeActor
										? 'Reconnecting'
										: 'Connecting…'
									: status === 'error'
										? (connection.error ?? null)
										: null}
							{@const chainId = connection.chainId}
							{@const networkName = chainId
								? (networksByChainId[chainId]?.name ?? `Chain ${chainId}`)
								: null}
							{@const walletChipClass =
								status === 'connecting'
									? 'wallet-chip wallet-connecting'
									: status === 'error'
										? 'wallet-chip wallet-failed'
										: 'wallet-chip'}
							{@const walletMenuItems = getWalletMenuEntries(
								wallet,
								connection,
								status,
							)}
							<ToggleGroup.Item
								value={wallet.$id.rdns}
								data-tag="wallet-type"
								data-connecting={status === 'connecting'}
								data-failed={status === 'error'}
								class="wallet-connection-item"
							>
								<span class={walletChipClass} data-row="start gap-1">
									<NetworkIcon
										networkId={{ chainId: chainId ?? selectedChainIdDerived ?? 1 }}
										subicon={
											wallet.icon
												? { src: wallet.icon }
												: undefined
										}
										title={networkName ?? 'Unknown network'}
									/>
									<span class="wallet-details" data-column="gap-0">
										{#if connection.activeActor}
											<span data-wallet-address>
												<Address
													actorId={{ $network: { chainId: chainId ?? selectedChainIdDerived ?? 1 }, address: connection.activeActor }}
													isLinked={false}
												/>
											</span>
											{#if statusLabel}
												<span class="wallet-status">{statusLabel}</span>
											{/if}
										{:else}
											<span class="wallet-status">{statusLabel ?? '—'}</span>
										{/if}
									</span>
									<Dropdown
										items={walletMenuItems}
										triggerAriaLabel="Wallet menu"
										triggerProps={{
											'data-wallet-menu-trigger': true,
											onclick: (event: MouseEvent) => event.stopPropagation(),
										}}
									>
										{#snippet Trigger()}
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
										{/snippet}
										{#snippet Item(item)}
											{#if item.kind === 'actor'}
												<span class="wallet-menu-option" data-row="start">
													<Address
														actorId={{ $network: { chainId: chainId ?? selectedChainIdDerived ?? 1 }, address: item.actor }}
														isLinked={false}
													/>
												</span>
											{:else if item.kind === 'network'}
												<span class="wallet-menu-option" data-row="start">
													<NetworkIcon
														networkId={{ chainId: item.network.id }}
													/>
													<span>{item.network.name}</span>
												</span>
											{:else if item.kind === 'disconnect'}
												<span data-wallet-disconnect>{item.label}</span>
											{:else}
												{item.label}
											{/if}
										{/snippet}
									</Dropdown>
								</span>
							</ToggleGroup.Item>
						{/each}
					</ToggleGroup.Root>
				{:else}
					<ToggleGroup.Root
						type="multiple"
						bind:value={() => selectedRdns, onMultipleSelectionChange}
						data-row="wrap"
					>
						{#each readOnlyWalletChips as { wallet, connection, status } (stringify(wallet.$id))}
							{@const isConnected = status === 'connected'}
							{@const isReadOnly =
								connection.transport === WalletConnectionTransport.None}
							{@const statusLabel =
								status === 'connecting'
									? connection.activeActor
										? 'Reconnecting'
										: 'Connecting…'
									: status === 'error'
										? (connection.error ?? null)
										: null}
							{@const chainId = connection.chainId}
							{@const networkName = chainId
								? (networksByChainId[chainId]?.name ?? `Chain ${chainId}`)
								: null}
							{@const walletChipClass =
								status === 'connecting'
									? 'wallet-chip wallet-connecting'
									: status === 'error'
										? 'wallet-chip wallet-failed'
										: 'wallet-chip'}
							{@const walletMenuItems = getWalletMenuEntries(
								wallet,
								connection,
								status,
							)}
							<ToggleGroup.Item
								value={wallet.$id.rdns}
								data-tag="wallet-type"
								data-connecting={status === 'connecting'}
								data-failed={status === 'error'}
								class="wallet-connection-item"
							>
								<span class={walletChipClass} data-row="start gap-1">
									<NetworkIcon
										networkId={{ chainId: chainId ?? selectedChainIdDerived ?? 1 }}
										subicon={
											wallet.icon
												? { src: wallet.icon }
												: undefined
										}
										title={networkName ?? 'Unknown network'}
									/>
									<span class="wallet-details" data-column="gap-0">
										{#if connection.activeActor}
											<span data-wallet-address>
												<Address
													actorId={{ $network: { chainId: chainId ?? selectedChainIdDerived ?? 1 }, address: connection.activeActor }}
													isLinked={false}
												/>
											</span>
											{#if statusLabel}
												<span class="wallet-status">{statusLabel}</span>
											{/if}
										{:else}
											<span class="wallet-status">{statusLabel ?? '—'}</span>
										{/if}
									</span>
									<Dropdown
										items={walletMenuItems}
										triggerAriaLabel="Wallet menu"
										triggerProps={{
											'data-wallet-menu-trigger': true,
											onclick: (event: MouseEvent) => event.stopPropagation(),
										}}
									>
										{#snippet Trigger()}
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
										{/snippet}
										{#snippet Item(item)}
											{#if item.kind === 'actor'}
												<span class="wallet-menu-option" data-row="start">
													<Address
														actorId={{ $network: { chainId: chainId ?? selectedChainIdDerived ?? 1 }, address: item.actor }}
														isLinked={false}
													/>
												</span>
											{:else if item.kind === 'network'}
												<span class="wallet-menu-option" data-row="start">
													<NetworkIcon
														networkId={{ chainId: item.network.id }}
													/>
													<span>{item.network.name}</span>
												</span>
											{:else if item.kind === 'disconnect'}
												<span data-wallet-disconnect>{item.label}</span>
											{:else}
												{item.label}
											{/if}
										{/snippet}
									</Dropdown>
								</span>
							</ToggleGroup.Item>
						{/each}
					</ToggleGroup.Root>
				{/if}
			</div>
		{/if}
	{/if}

	{#if true}
		{@const walletConnectItems: WalletConnectEntry[] = (
			[
				...(
					availableWallets.length > 0 ?
						availableWallets.map((wallet) => ({
							type: 'item',
							id: `wallet-${wallet.$id.rdns}`,
							item: {
								kind: 'wallet',
								wallet,
							},
							onSelect: () => connect(stringify(wallet.$id)),
						}))
					:
						[
							{
								type: 'item',
								id: 'wallet-empty',
								item: {
									kind: 'empty',
									label: 'No wallets found',
								},
								disabled: true,
							},
						]
				),
				{ type: 'separator', id: 'wallet-connect-sep' },
			]
		)}
		<Dropdown
			items={walletConnectItems}
			triggerLabel={walletChips.length > 0 ? '+' : 'Connect Wallet'}
			triggerAriaLabel="Connect wallet"
			triggerProps={{
				'data-wallet-connect-trigger': true,
			}}
			contentProps={{
				'data-wallet-popover': true,
			}}
		>
			{#snippet Item(item)}
				{#if item.kind === 'wallet'}
					<span
						class="wallet-menu-option"
						data-row="start"
						data-wallet-provider-option
					>
						{#if item.wallet.icon}
							<Icon src={item.wallet.icon} />
						{/if}
						<span>{item.wallet.name}</span>
					</span>
				{:else}
					<span data-wallet-empty>{item.label}</span>
				{/if}
			{/snippet}
			<form
				class="account-watching"
				data-column
				onsubmit={(event) => (event.preventDefault(), connectReadOnlyAddress())}
			>
				<label class="account-watching-label" for="account-watching-address">
					Watching address
				</label>
				<div class="account-watching-field" data-row>
					<input
						id="account-watching-address"
						name="watching-address"
						type="text"
						placeholder="0x..."
						class="account-watching-input"
						data-row-item="flexible"
						bind:value={readOnlyAddress}
					/>
					<Button.Root type="submit">Add</Button.Root>
				</div>
			</form>
		</Dropdown>
	{/if}
</div>


<style>
	.wallet-chip {
		position: relative;

		&.wallet-connecting,
		&.wallet-failed {
			opacity: 0.7;
			cursor: default;
		}
	}

	.wallet-details {
		gap: 0.1rem;
	}

	.wallet-status {
		font-size: 0.75em;
		opacity: 0.7;
	}

	.wallet-menu-option {
		position: relative;
		width: 100%;
		padding-inline-end: 1.75rem;
	}

	:global(.wallet-connection-item) {
		&[data-state='on'] {
			:global(.wallet-chip)::after {
				content: '';
				position: absolute;
				top: 0.2rem;
				right: 0.2rem;
				width: 0.85rem;
				height: 0.85rem;
				border-radius: 9999px;
				background-color: var(--color-accent);
				box-shadow: 0 0 0 1px
					color-mix(in srgb, var(--color-accent) 70%, transparent);
				z-index: 0;
			}

			:global(.wallet-chip)::before {
				content: '✓';
				position: absolute;
				top: 0.2rem;
				right: 0.2rem;
				width: 0.85rem;
				height: 0.85rem;
				display: flex;
				align-items: center;
				justify-content: center;
				font-size: 0.55rem;
				line-height: 1;
				color: var(--color-primary-foreground);
				z-index: 1;
			}
		}
	}

	.account-watching {
		display: grid;
		gap: 0.5rem;
		padding: 0.5rem 0;
	}

	.account-watching-label {
		font-size: 0.75rem;
		text-transform: uppercase;
		opacity: 0.7;
	}

	.account-watching-field {
		align-items: center;
	}

	.account-watching-input {
		padding: 0.35rem 0.5rem;
		border-radius: 0.4rem;
		border: 1px solid var(--color-border);
		background: var(--color-bg-page);
		color: inherit;
		font: inherit;
	}

	.wallet-section-title {
		font-size: 0.75rem;
		text-transform: uppercase;
		opacity: 0.7;
	}
</style>
