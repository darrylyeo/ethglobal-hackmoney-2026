<script lang="ts">
	// Types/constants
	import type { ConnectedWallet } from '$/collections/WalletConnections.ts'
	import type { BridgeSessionParams } from '$/lib/session/params.ts'
	import { WalletConnectionTransport } from '$/data/WalletConnection.ts'
	import { fetchGatewayUnifiedBalance } from '$/api/gateway.ts'
	import { getGatewayWalletAddress } from '$/constants/gateway.ts'
	import { networksByChainId } from '$/constants/networks.ts'


	// Context
	import { Button, Dialog } from 'bits-ui'


	// Functions
	import { formatAddress } from '$/lib/address.ts'
	import { formatSmallestToDecimal } from '$/lib/format.ts'
	import { toasts } from '$/lib/toast.svelte.ts'


	// Components
	import GatewayExecution from './GatewayExecution.svelte'


	// Props
	let {
		selectedWallets,
		selectedActor,
		settings,
		recipient,
		onExecutionSuccess,
		balanceTokens = $bindable([]),
	}: {
		selectedWallets: ConnectedWallet[]
		selectedActor: `0x${string}` | null
		settings: BridgeSessionParams
		recipient: `0x${string}` | null
		onExecutionSuccess?: (args: { txHash?: `0x${string}` }) => void
		balanceTokens?: {
			chainId: number
			tokenAddress: `0x${string}`
		}[]
	} = $props()


	// State
	let unifiedBalance = $state<bigint | null>(null)
	let balanceError = $state<string | null>(null)
	let balanceLoading = $state(false)
	let confirmOpen = $state(false)
	let executing = $state(false)
	let runExecutionAt = $state(0)


	// (Derived)
	const selectedWallet = $derived(
		selectedWallets.find((w) => w.connection.selected) ?? null,
	)
	const walletProvider = $derived(
		selectedWallet?.connection.transport ===
			WalletConnectionTransport.Eip1193 && 'provider' in selectedWallet.wallet
			? selectedWallet.wallet.provider
			: null,
	)
	const fromNetwork = $derived(
		settings.fromChainId !== null
			? Object.values(networksByChainId).find(
					(entry) => entry?.id === settings.fromChainId,
				) ?? null
			: null,
	)
	const toNetwork = $derived(
		settings.toChainId !== null
			? Object.values(networksByChainId).find(
					(entry) => entry?.id === settings.toChainId,
				) ?? null
			: null,
	)
	const walletAddress = $derived(
		getGatewayWalletAddress(settings.fromChainId, settings.isTestnet),
	)
	const canInstantTransfer = $derived(
		unifiedBalance !== null && settings.amount > 0n && unifiedBalance >= settings.amount,
	)
	const needsDeposit = $derived(
		unifiedBalance !== null && settings.amount > 0n && unifiedBalance < settings.amount,
	)
	const gatewayPairReady = $derived(
		settings.fromChainId !== null &&
			settings.toChainId !== null &&
			recipient !== null &&
			selectedWallet !== null &&
			settings.amount > 0n,
	)

	const onConfirmBridge = () => {
		confirmOpen = true
	}
	const onConfirmSubmit = () => {
		confirmOpen = false
		runExecutionAt = Date.now()
	}
	const onExecutionStatus = (
		_step: 'deposit' | 'sign' | 'attestation' | 'mint',
		status: 'pending' | 'done' | 'error',
		detail?: string,
	) => {
		if (status === 'done' && _step === 'mint' && detail?.startsWith('0x'))
			onExecutionSuccess?.({ txHash: detail as `0x${string}` })
		if (status === 'error' && detail)
			toasts.error(detail, { title: 'Gateway transfer failed' })
		if (status === 'done' && _step === 'mint')
			toasts.success('Gateway transfer complete', { title: 'Success' })
	}


	// Effects
	$effect(() => {
		const actor = selectedActor
		const isTestnet = settings.isTestnet
		if (!actor) {
			unifiedBalance = null
			balanceError = null
			return
		}
		let cancelled = false
		balanceLoading = true
		balanceError = null
		fetchGatewayUnifiedBalance(actor, isTestnet)
			.then((bal) => {
				if (!cancelled) unifiedBalance = bal
			})
			.catch((err) => {
				if (!cancelled)
					balanceError = err instanceof Error ? err.message : String(err)
			})
			.finally(() => {
				if (!cancelled) balanceLoading = false
			})
		return () => {
			cancelled = true
		}
	})
</script>

{#if recipient && fromNetwork && toNetwork}
	<div data-preview data-column="gap-1">
		<strong>Transfer preview</strong>
		<dl class="bridge-summary">
			<dt>From</dt>
			<dd>
				{formatSmallestToDecimal(settings.amount, 6)} USDC on {fromNetwork.name}
			</dd>
			<dt>To</dt>
			<dd>{toNetwork.name}</dd>
			<dt>Recipient</dt>
			<dd>{formatAddress(recipient)}</dd>
		</dl>
	</div>
{/if}

<div data-card data-column="gap-3">
	<h3>Gateway</h3>
	{#if balanceLoading}
		<p data-muted>Loading unified balance…</p>
	{:else if balanceError}
		<p data-error>{balanceError}</p>
	{:else if unifiedBalance !== null}
		<p data-muted>
			Unified USDC balance:
			{formatSmallestToDecimal(unifiedBalance, 6)}
			USDC
		</p>
		{#if canInstantTransfer}
			<p data-muted>Instant transfer: sign burn intent, then mint on destination.</p>
		{:else if needsDeposit}
			<p data-muted>
				Deposit USDC to Gateway Wallet on
				{fromNetwork?.name ?? 'source chain'}
				first. Wallet contract:
				{walletAddress ?? '—'}
			</p>
		{/if}
	{:else if selectedActor}
		<p data-muted>Connect wallet to see unified balance.</p>
	{:else}
		<p data-muted>Connect a wallet to continue.</p>
	{/if}

	<div data-column="gap-2">
		<GatewayExecution
			bind:executing
			{walletProvider}
			senderAddress={selectedActor}
			fromChainId={settings.fromChainId}
			toChainId={settings.toChainId}
			amount={settings.amount}
			recipient={recipient ?? '0x0000000000000000000000000000000000000000'}
			isTestnet={settings.isTestnet}
			{needsDeposit}
			runAt={runExecutionAt}
			onStatus={onExecutionStatus}
		/>
		<Button.Root
			type="button"
			disabled={!gatewayPairReady || !recipient || !selectedWallet || executing}
			onclick={onConfirmBridge}
		>
			Sign and Submit
		</Button.Root>
	</div>
</div>

<Dialog.Root bind:open={confirmOpen}>
	<Dialog.Portal>
		<Dialog.Content>
			<Dialog.Title>Confirm Gateway transfer</Dialog.Title>
			{#if fromNetwork && toNetwork && recipient}
				<Dialog.Description>
					Send {formatSmallestToDecimal(settings.amount, 6)} USDC from {fromNetwork.name}
					to {toNetwork.name}. Recipient: {formatAddress(recipient)}.
					{needsDeposit ? ' Deposit will be executed first, then instant transfer.' : ''}
				</Dialog.Description>
			{/if}
			<div data-row="gap-2" class="dialog-actions">
				<Button.Root
					type="button"
					onclick={() => {
						confirmOpen = false
					}}>Cancel</Button.Root
				>
				<Button.Root type="button" onclick={onConfirmSubmit}
					>Confirm</Button.Root
				>
			</div>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>
