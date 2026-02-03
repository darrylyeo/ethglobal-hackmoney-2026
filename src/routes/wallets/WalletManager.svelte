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
				item: WalletConnectItem
				onSelect?: () => void
				disabled?: boolean
		  }
		| { type: string }

	// Context
	import { useLiveQuery, eq } from '@tanstack/svelte-db'
	import { useWalletSubscriptions } from '$/state/wallet.svelte'
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
						name: 'Read-only',
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
			.filter((w): w is NonNullable<ReturnType<typeof joinWallet>> => w !== null)
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
		const nextChainId = settings.fromChainId
		if (!nextChainId) return
		if (
			connectReadOnly({ address: readOnlyAddress.trim(), chainId: nextChainId })
		) {
			readOnlyAddress = ''
		}
	}

	const walletConnectItems = $derived<WalletConnectEntry[]>(
		[
			...(
				availableWallets.length > 0 ?
					availableWallets.map((wallet) => ({
						type: 'item',
						item: { kind: 'wallet', wallet } as WalletConnectItem,
						onSelect: () => connect(wallet.$id.rdns),
					}))
				:
					[
						{
							type: 'item',
							item: { kind: 'empty', label: 'No wallets found' } as WalletConnectItem,
							disabled: true,
						},
					]
			),
			{ type: 'separator' },
		],
	)

	// Components
	import Address from '$/components/Address.svelte'
	import Dropdown from '$/components/Dropdown.svelte'
	import Icon from '$/components/Icon.svelte'
	import NetworkInput from '$/views/NetworkInput.svelte'
	import { Button } from 'bits-ui'
</script>

<div class="wallet-manager" data-column="gap-2">
	<details class="wallet-manager-group" data-open={eip1193Chips.length > 0}>
		<summary class="wallet-manager-group-summary">Wallets ({eip1193Chips.length})</summary>
		<ul class="wallet-manager-list">
			{#each eip1193Chips as { wallet, connection, status } (wallet.$id.rdns)}
				{@const chainId = connection.chainId ?? 1}
				{@const networkName = connection.chainId
					? (networksByChainId[connection.chainId]?.name ?? `Chain ${connection.chainId}`)
				:
					null}
				<li class="wallet-manager-entry">
					<details class="wallet-manager-entry-inner">
						<summary class="wallet-manager-entry-summary">
							{#if wallet.icon}
								<Icon
									src={wallet.icon}
									alt=""
									size={20}
									loading="lazy"
									decoding="async"
								/>
							{/if}
							<span>{wallet.name}</span>
							{#if connection.activeActor}
								<Address
									network={chainId}
									address={connection.activeActor}
									linked={false}
								/>
							{:else}
								<span class="wallet-manager-status">
									{status === 'connecting'
										? 'Connecting…'
									: status === 'error'
										? 'Locked'
									:
										'—'}
								</span>
							{/if}
						</summary>
						<div class="wallet-manager-details" data-column="gap-1">
							{#if (connection.actors ?? []).length > 0}
								<details class="wallet-manager-details-section">
									<summary class="wallet-manager-details-summary">Accounts ({connection.actors.length})</summary>
									<ul class="wallet-manager-details-list">
										{#each connection.actors ?? [] as actor}
											<li>
												<button
													type="button"
													class="wallet-manager-action"
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
								<details class="wallet-manager-details-section">
									<summary class="wallet-manager-details-summary">Network</summary>
									<div data-row="gap-2 align-center wrap">
										<span>
											{networkName ?? 'Unknown'}
										</span>
										<NetworkInput
											networks={filteredNetworks}
											value={connection.chainId}
											onValueChange={(v) =>
												typeof v === 'number' &&
												connection.transport === WalletConnectionTransport.Eip1193 &&
												'provider' in wallet &&
												switchNetwork(
													connection as WalletConnectionRow,
													wallet,
													v,
												)
													.catch(() => {})}
											placeholder="Switch network"
											ariaLabel="Switch network"
										/>
									</div>
								</details>
							{/if}
							<span class="wallet-manager-disconnect">
								<Button.Root
									type="button"
									onclick={() => disconnectWallet(wallet.$id)}
								>
									Disconnect
								</Button.Root>
							</span>
						</div>
					</details>
				</li>
			{/each}
		</ul>
	</details>

	<details class="wallet-manager-group" data-open={readOnlyChips.length > 0}>
		<summary class="wallet-manager-group-summary">Read-only ({readOnlyChips.length})</summary>
		<ul class="wallet-manager-list">
			{#each readOnlyChips as { wallet, connection } (wallet.$id.rdns)}
				{@const chainId = connection.chainId ?? 1}
				{@const networkName = connection.chainId
					? (networksByChainId[connection.chainId]?.name ?? `Chain ${connection.chainId}`)
				:
					null}
				<li class="wallet-manager-entry">
					<div class="wallet-manager-summary" data-row="gap-2 align-center wrap">
						{#if connection.activeActor}
							<Address
								network={chainId}
								address={connection.activeActor}
								linked={false}
							/>
						{/if}
						<span>{networkName ?? 'Unknown'}</span>
						<span class="wallet-manager-disconnect">
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

	<details class="wallet-manager-group" open>
		<summary class="wallet-manager-group-summary">Add connection</summary>
		<div class="wallet-manager-connect" data-column="gap-2">
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
						<span class="wallet-menu-option" data-wallet-provider-option>
							{#if item.wallet.icon}
								<Icon
									src={item.wallet.icon}
									alt=""
									size={20}
									loading="lazy"
									decoding="async"
								/>
							{/if}
							<span>{item.wallet.name}</span>
						</span>
					{:else}
						<span data-wallet-empty>{item.label}</span>
					{/if}
				{/snippet}
			</Dropdown>
			<form
				class="wallet-readonly"
				onsubmit={(e) => (
					e.preventDefault(),
					connectReadOnlyAddress()
				)}
			>
				<label class="wallet-readonly-label" for="wallet-manager-readonly">
					Read-only address
				</label>
				<div class="wallet-readonly-field">
					<input
						id="wallet-manager-readonly"
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
		</div>
	</details>
</div>

<style>
	.wallet-manager {
		max-inline-size: 40rem;
	}

	.wallet-manager-group {
		border: 1px solid var(--color-border);
		border-radius: 0.5rem;
		overflow: hidden;
	}

	.wallet-manager-group-summary {
		padding: 0.5rem 0.75rem;
		background: var(--color-bg-elevated, #f5f5f5);
		cursor: pointer;
		list-style: none;
	}

	.wallet-manager-group-summary::-webkit-details-marker {
		display: none;
	}

	.wallet-manager-list {
		list-style: none;
		padding: 0.5rem;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.wallet-manager-entry-inner {
		border: 1px solid var(--color-border);
		border-radius: 0.4rem;
	}

	.wallet-manager-entry-summary {
		padding: 0.35rem 0.5rem;
		cursor: pointer;
		list-style: none;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.wallet-manager-entry-summary::-webkit-details-marker {
		display: none;
	}

	.wallet-manager-details {
		padding: 0.5rem 0.75rem;
		border-block-start: 1px solid var(--color-border);
	}

	.wallet-manager-details-list {
		list-style: none;
		padding: 0;
		margin: 0;
	}

	.wallet-manager-details-section {
		border: none;
		margin-block-end: 0.5rem;
	}

	.wallet-manager-details-summary {
		padding: 0.25rem 0;
		font-size: 0.9em;
	}

	.wallet-manager-summary {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.wallet-manager-status {
		font-size: 0.85em;
		opacity: 0.8;
	}

	.wallet-manager-action {
		background: none;
		border: none;
		padding: 0.2rem 0;
		cursor: pointer;
		font: inherit;
		color: inherit;
		text-align: start;
	}

	.wallet-manager-action:hover {
		text-decoration: underline;
	}

	.wallet-manager-disconnect :global(button) {
		font-size: 0.9em;
		opacity: 0.9;
	}

	.wallet-manager-connect {
		padding: 0.5rem 0.75rem;
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

	.wallet-menu-option {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		width: 100%;
		padding-inline-end: 1.75rem;
	}
</style>
