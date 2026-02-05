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
		networkConfigsByChainId,
		networks,
		networksByChainId,
	} from '$/constants/networks'
	import { DataSource } from '$/constants/data-sources'
	type WalletConnectItem =
		| { kind: 'wallet'; wallet: WalletRow }
		| { kind: 'empty'; label: string }
	type WalletConnectEntry =
		| {
				type: string
				id?: string
				item: WalletConnectItem
				onSelect?: () => void
				disabled?: boolean
		  }
		| { type: string; id?: string }


	// Context
	import { useLiveQuery, eq } from '@tanstack/svelte-db'
	import { useWalletSubscriptions } from '$/state/wallet.svelte'
	import { liveQueryLocalAttachmentFrom } from '$/svelte/live-query-context.svelte'
	import {
		walletConnectionsCollection,
		requestWalletConnection,
		switchActiveActor,
		disconnectWallet,
		connectReadOnly,
	} from '$/collections/wallet-connections'
	import type { WalletRow } from '$/collections/wallets'
	import { walletsCollection } from '$/collections/wallets'
	import {
		bridgeSettingsState,
		defaultBridgeSettings,
	} from '$/state/bridge-settings.svelte'
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
	const liveQueryEntries = [
		{ id: 'accounts-watching', label: 'Watching', query: walletsQuery },
		{
			id: 'accounts-connections',
			label: 'Wallet Connections',
			query: connectionsQuery,
		},
	]
	const liveQueryAttachment = liveQueryLocalAttachmentFrom(
		() => liveQueryEntries,
	)

	const settings = $derived(
		bridgeSettingsState.current ?? defaultBridgeSettings,
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
						name: 'Watching',
						icon: '',
						rdns: c.$id.wallet$id.rdns,
						$source: c.$source,
					},
					connection: c,
				}
			: ((wallet) => (wallet ? { wallet, connection: c } : null))(
					walletsByRdns.get(c.$id.wallet$id.rdns),
				)

	const walletChips = $derived<
		(ConnectedWallet & { status: 'connected' | 'connecting' | 'error' })[]
	>(
		connections
			.map(joinWallet)
			.filter(
				(w): w is NonNullable<ReturnType<typeof joinWallet>> => w !== null,
			)
			.map((c) => ({
				...c,
				status: c.connection.status as 'connected' | 'connecting' | 'error',
			})),
	)
	const eip1193Chips = $derived(
		walletChips.filter(
			(chip) => chip.connection.transport === WalletConnectionTransport.Eip1193,
		),
	)
	const readOnlyChips = $derived(
		walletChips.filter(
			(chip) => chip.connection.transport === WalletConnectionTransport.None,
		),
	)

	const connectedRdns = $derived(
		new Set(connections.map((c) => c.$id.wallet$id.rdns)),
	)
	const availableWallets = $derived(
		wallets.filter((w) => !connectedRdns.has(w.$id.rdns)),
	)
	const filteredNetworks = $derived(
		networks.filter((n) =>
			settings.isTestnet
				? n.type === NetworkType.Testnet
				: n.type === NetworkType.Mainnet,
		),
	)

	let readOnlyAddress = $state('')


	// Actions
	const connect = (rdns: string) =>
		requestWalletConnection({ rdns }).catch(() => {})
	const switchNetwork = (
		connection: WalletConnectionRow,
		wallet: WalletRow | ReadOnlyWalletRow,
		chainId: number,
	) =>
		connection.transport === WalletConnectionTransport.Eip1193 &&
		'provider' in wallet
			? switchWalletChain(wallet.provider, chainId)
			: Promise.resolve()
	const onReadOnlyInput = (
		event: Event & { currentTarget: HTMLInputElement },
	) => (readOnlyAddress = event.currentTarget.value)
	const connectReadOnlyAddress = () => {
		if (connectReadOnly({ address: readOnlyAddress.trim() })) {
			readOnlyAddress = ''
		}
	}

	const walletConnectItems = $derived<WalletConnectEntry[]>([
		...(availableWallets.length > 0
			? availableWallets.map((wallet) => ({
					type: 'item',
					id: `wallet-${wallet.$id.rdns}`,
					item: { kind: 'wallet', wallet } as WalletConnectItem,
					onSelect: () => connect(wallet.$id.rdns),
				}))
			: [
					{
						type: 'item',
						id: 'wallet-empty',
						item: {
							kind: 'empty',
							label: 'No wallets found',
						} as WalletConnectItem,
						disabled: true,
					},
				]),
	])


	// Components
	import Address from '$/components/Address.svelte'
	import Dropdown from '$/components/Dropdown.svelte'
	import Icon from '$/components/Icon.svelte'
	import NetworkInput from '$/views/NetworkInput.svelte'
	import { Button } from 'bits-ui'
</script>


<div data-row="wrap align-start" {@attach liveQueryAttachment}>
	<details data-row-item="flexible" data-card="secondary radius-4" open>
		<summary data-row="gap-2 align-center wrap">
			<div data-row>
				<div data-row="gap-2 align-center">
					<h4>Watching addresses</h4>

					<span
						data-badge="small"
						aria-label={`${readOnlyChips.length} watching connections`}
					>
						{readOnlyChips.length}
					</span>
				</div>

				<Dropdown
					items={[]}
					triggerLabel="+"
					triggerAriaLabel="Add watching address"
					triggerProps={{
						'data-account-watching-trigger': true,
						onclick: (e: MouseEvent) => e.stopPropagation(),
					}}
					contentProps={{
						'data-account-watching-popover': true,
					}}
				>
					{#snippet children()}
						<form
							class="add-form"
							data-column="gap-2"
							onsubmit={(e) => (e.preventDefault(), connectReadOnlyAddress())}
						>
							<label for="accounts-add-watching">Watching address</label>
							<div data-row="gap-2 align-center">
								<span data-row-item="flexible">
									<input
										id="accounts-add-watching"
										name="watching-address"
										type="text"
										placeholder="0x..."
										value={readOnlyAddress}
										oninput={onReadOnlyInput}
									/>
								</span>
								<Button.Root type="submit">Add</Button.Root>
							</div>
						</form>
					{/snippet}
				</Dropdown>
			</div>
		</summary>

		<ul class="list" data-column="gap-2">
			{#each readOnlyChips as { wallet, connection } (wallet.$id.rdns)}
				<li>
					<div
						data-card="secondary padding-2 radius-3"
						data-row="gap-2 align-center wrap"
					>
						{#if connection.activeActor}
							<Address
								network={1}
								address={connection.activeActor}
								linked={false}
							/>
						{/if}
						<span class="disconnect">
							<Button.Root
								type="button"
								onclick={() => disconnectWallet(wallet.$id)}
							>
								Remove
							</Button.Root>
						</span>
					</div>
				</li>
			{/each}
		</ul>
	</details>

	<details data-row-item="flexible" data-card="secondary radius-4" open>
		<summary>
			<div data-row>
				<div data-row="gap-2 align-center">
					<h4>Wallet Connections</h4>

					<span
						data-badge="small"
						aria-label={`${eip1193Chips.length} wallets`}
					>
						{eip1193Chips.length}
					</span>
				</div>

				<Dropdown
					items={walletConnectItems}
					triggerLabel="+"
					triggerAriaLabel="Connect wallet"
					triggerProps={{
						'data-wallet-connect-trigger': true,
						onclick: (e: MouseEvent) => e.stopPropagation(),
					}}
					contentProps={{
						'data-wallet-popover': true,
					}}
				>
					{#snippet Item(item)}
						{#if item.kind === 'wallet'}
							<span data-row="gap-2 align-center" data-wallet-provider-option>
								{#if item.wallet.icon}
									<Icon src={item.wallet.icon} size={20} />
								{/if}
								<span>{item.wallet.name}</span>
							</span>
						{:else}
							<span data-wallet-empty>{item.label}</span>
						{/if}
					{/snippet}
				</Dropdown>
			</div>
		</summary>

		<ul data-list="unstyled">
			{#each eip1193Chips as { wallet, connection, status } (wallet.$id.rdns)}
				{@const chainId = connection.chainId ?? 1}
				{@const networkName = connection.chainId
					? (networksByChainId[connection.chainId]?.name ??
						`Chain ${connection.chainId}`)
					: null}

				<li>
					<details data-card="secondary radius-2" open>
						<summary data-status={status}>
							<div data-row>
								<div data-row>
									<span data-row="gap-2 align-center">
										{#if wallet.icon}
											<Icon src={wallet.icon} size={20} />
										{/if}
										<span>{wallet.name}</span>
									</span>

									<span class="meta" data-row="gap-2 align-center">
										{#if connection.activeActor}
											<Address
												network={chainId}
												address={connection.activeActor}
												linked={false}
											/>
										{:else}
											<span class="meta status" data-badge="small">
												{status === 'connecting'
													? 'Connecting…'
													: status === 'error' && connection.error
														? connection.error
														: '—'}
											</span>
										{/if}
									</span>
								</div>

								<span class="disconnect" onclick={(e) => e.stopPropagation()}>
									<Button.Root
										type="button"
										onclick={() => disconnectWallet(wallet.$id)}
									>
										Disconnect
									</Button.Root>
								</span>
							</div>
						</summary>
						<div class="panel" data-column="gap-1">
							{#if (connection.actors ?? []).length > 0}
								<details class="nested" open>
									<summary>
										Accounts ({connection.actors.length})
									</summary>
									<ul class="list" data-column="gap-1">
										{#each connection.actors ?? [] as actor}
											<li>
												<button
													type="button"
													class="action-text"
													onclick={() => switchActiveActor(wallet.$id, actor)}
												>
													<Address
														network={chainId}
														address={actor}
														linked={false}
													/>
													{#if connection.activeActor === actor}
														<span aria-hidden="true"> ✓</span>
													{/if}
												</button>
											</li>
										{/each}
									</ul>
								</details>
							{/if}

							{#if filteredNetworks.length > 0 && status === 'connected'}
								<details class="nested" open>
									<summary> Network </summary>
									<div data-row="gap-2 align-center wrap">
										<span>{networkName ?? 'Unknown'}</span>
										<NetworkInput
											networks={filteredNetworks}
											bind:value={
												() => connection.chainId,
												(v) =>
													typeof v === 'number' &&
													connection.transport ===
														WalletConnectionTransport.Eip1193 &&
													'provider' in wallet &&
													switchNetwork(
														connection as WalletConnectionRow,
														wallet,
														v,
													).catch(() => {})
											}
											placeholder="Switch network"
											ariaLabel="Switch network"
										/>
									</div>
								</details>
							{/if}
						</div>
					</details>
				</li>
			{/each}
		</ul>
	</details>
</div>
