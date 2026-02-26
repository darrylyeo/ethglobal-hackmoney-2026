<script lang="ts">
	// Types/constants
	import type {
		ConnectedWallet,
		ReadOnlyWalletRow,
		WalletConnectionRow,
	} from '$/collections/WalletConnections.ts'
	import type { WalletRow } from '$/collections/Wallets.ts'
	import { DataSource } from '$/constants/data-sources.ts'
	import { NetworkEnvironment } from '$/constants/network-environment.ts'
	import {
		NetworkType,
		networks,
		networksByChainId,
	} from '$/constants/networks.ts'
	import { WalletConnectionTransport } from '$/data/WalletConnection.ts'
	import { stringify } from 'devalue'

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

	import {
		connectReadOnly,
		disconnectWallet,
		requestWalletConnection,
		switchActiveActor,
		walletConnectionsCollection,
	} from '$/collections/WalletConnections.ts'
	import { walletsCollection } from '$/collections/Wallets.ts'
	import { switchWalletChain } from '$/lib/wallet.ts'
	import { networkEnvironmentState } from '$/state/network-environment.svelte.ts'
	import { useWalletSubscriptions } from '$/state/wallet.svelte.ts'
	import { registerLocalLiveQueryStack } from '$/svelte/live-query-context.svelte.ts'
	import { eq, useLiveQuery } from '@tanstack/svelte-db'


	// Context
	useWalletSubscriptions()

	const walletsQuery = useLiveQuery((q) =>
		q
			.from({ wallet: walletsCollection })
			.select(({ wallet }) => ({ wallet })),
	)
	const connectionsQuery = useLiveQuery((q) =>
		q
			.from({ walletConnection: walletConnectionsCollection })
			.select(({ walletConnection }) => ({ walletConnection })),
	)
	const liveQueryEntries = [
		{ id: 'accounts-watching', label: 'Watching', query: walletsQuery },
		{
			id: 'accounts-connections',
			label: 'Wallet Connections',
			query: connectionsQuery,
		},
	]
	registerLocalLiveQueryStack(() => liveQueryEntries)


	// (Derived)
	const connections = $derived(
		(connectionsQuery.data ?? [])
			.map(({ walletConnection: connection }) => connection)
			.filter((c) => c?.$id?.wallet$id?.rdns),
	)
	const wallets = $derived(
		(walletsQuery.data ?? [])
			.map(({ wallet }) => wallet)
			.filter((w): w is WalletRow => !!w?.$id?.rdns),
	)
	const walletsByRdns = $derived(new Map(wallets.map((w) => [w.$id.rdns, w])))


	// Functions
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


	// (Derived)
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
			networkEnvironmentState.current === NetworkEnvironment.Testnet
				? n.type === NetworkType.Testnet
				: n.type === NetworkType.Mainnet,
		),
	)


	// State
	let readOnlyAddress = $state<`0x${string}` | null>(null)


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
	const connectReadOnlyAddress = () => {
		if (readOnlyAddress && connectReadOnly({ address: readOnlyAddress })) {
			readOnlyAddress = null
		}
	}


	// (Derived)
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
	import Dropdown from '$/components/Dropdown.svelte'
	import Icon from '$/components/Icon.svelte'
	import Address from '$/views/Address.svelte'
	import AddressInput from '$/views/AddressInput.svelte'
	import NetworkInput from '$/views/NetworkInput.svelte'
	import { Button } from 'bits-ui'
</script>


<div data-row="wrap align-start">
	<details data-row-item="flexible" data-card="radius-4" open>
		<summary data-row="align-center wrap">
			<div data-row>
				<div data-row="align-center">
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
							data-column
							onsubmit={(e) => (e.preventDefault(), connectReadOnlyAddress())}
						>
							<div data-row="align-center">
								<span data-row-item="flexible">
									<AddressInput
										items={[]}
										bind:value={readOnlyAddress}
										placeholder="Address or ENS"
										id="accounts-add-watching"
										ariaLabel="Watching address"
									/>
								</span>
								<Button.Root type="submit" disabled={!readOnlyAddress}>
									Add
								</Button.Root>
							</div>
						</form>
					{/snippet}
				</Dropdown>
			</div>
		</summary>

		<ul class="list" data-column>
			{#each readOnlyChips as { wallet, connection } (stringify(wallet.$id))}
				<li>
					<div
						data-card="padding-2 radius-3"
						data-row="align-center wrap"
					>
						{#if connection.activeActor}
							<Address
								actorId={{ $network: { chainId: 1 }, address: connection.activeActor }}
								isLinked={false}
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

	<details data-row-item="flexible" data-card="radius-4" open>
		<summary>
			<div data-row>
				<div data-row="align-center">
					<h3 class="section-heading">Wallet Connections</h3>

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
							<span data-row="align-center" data-wallet-provider-option>
								{#if item.wallet.icon}
									<Icon src={item.wallet.icon} />
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
			{#each eip1193Chips as { wallet, connection, status } (stringify(wallet.$id))}
				{@const chainId = connection.chainId ?? 1}
				{@const networkName = connection.chainId
					? (networksByChainId[connection.chainId]?.name ??
						`Chain ${connection.chainId}`)
					: null}
				{@const chainIcon = networksByChainId[chainId]?.icon}

				<li>
					<details data-card open>
						<summary data-status={status}>
							<div data-row>
								<div data-row>
									<span data-row="align-center">
										{#if wallet.icon}
											<Icon
												src={wallet.icon}
												subicon={
													chainIcon
														? {
																src: chainIcon,
																backgroundColor:
																	networksByChainId[chainId]?.color,
															}
														: undefined
												}
											/>
										{/if}
										<span>{wallet.name}</span>
									</span>

									<span class="meta" data-row="align-center">
										{#if connection.activeActor}
											<Address
												actorId={{ $network: { chainId }, address: connection.activeActor }}
												isLinked={false}
											/>
										{:else}
											<span class="meta status" data-badge="small">
												{status === 'connecting'
													? 'Connecting…'
													: status === 'error' && connection.error != null
														? (connection.error instanceof Error
															? connection.error.message
															: String(connection.error))
														: '—'}
											</span>
										{/if}
									</span>
								</div>

								<span class="disconnect" role="group">
									<Button.Root
										type="button"
										onclick={(e) => {
											e.stopPropagation()
											disconnectWallet(wallet.$id)
										}}
									>
										Disconnect
									</Button.Root>
								</span>
							</div>
						</summary>
						<div class="panel" data-column>
							{#if (connection.actors ?? []).length > 0}
								<details class="nested" open>
									<summary>
										Accounts ({connection.actors.length})
									</summary>
									<ul class="list" data-column>
										{#each connection.actors ?? [] as actor}
											<li>
												<button
													type="button"
													class="action-text"
													onclick={() => switchActiveActor(wallet.$id, actor)}
												>
													<Address
														actorId={{ $network: { chainId }, address: actor }}
														isLinked={false}
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
									<div data-row="align-center wrap">
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
