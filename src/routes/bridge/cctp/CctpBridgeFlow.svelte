<script lang="ts">
	// Types/constants
	import type { ConnectedWallet } from '$/collections/WalletConnections.ts'
	import type { ActionParams } from '$/constants/actions.ts'
	import { ActionType, TransferSpeed } from '$/constants/actions.ts'
	import { WalletConnectionTransport } from '$/data/WalletConnection.ts'
	import {
		CCTP_FAST_TRANSFER_SOURCE_CHAIN_IDS,
		CCTP_FORWARDING_CHAIN_IDS,
	} from '$/constants/cctp.ts'
	import { getCctpDomainId } from '$/lib/cctp.ts'
	import { networksByChainId } from '$/constants/networks.ts'


	// Context
	import { Button, Dialog } from 'bits-ui'


	// Functions
	import { formatAddress } from '$/lib/address.ts'
	import { formatSmallestToDecimal } from '$/lib/format.ts'


	// Components
	import CctpAllowance from './CctpAllowance.svelte'
	import CctpExecution from './CctpExecution.svelte'
	import CctpFees from './CctpFees.svelte'


	// Props
	let {
		selectedWallets,
		selectedActor,
		settings,
		recipient,
		minOutput,
		onExecutionSuccess,
		balanceTokens = $bindable([]),
	}: {
		selectedWallets: ConnectedWallet[]
		selectedActor: `0x${string}` | null
		settings: ActionParams<ActionType.Bridge>
		recipient: `0x${string}` | null
		minOutput: bigint | null
		onExecutionSuccess?: (args: { txHash?: `0x${string}` }) => void
		balanceTokens?: {
			chainId: number
			tokenAddress: `0x${string}`
		}[],
	} = $props()


	// State
	let confirmOpen = $state(false)
	let feeFastBps = $state<number | null>(null)
	let feeStandardBps = $state<number | null>(null)
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
	const resolveNetwork = (chainId: number | null) =>
		chainId !== null
			? (Object.values(networksByChainId).find(
					(entry) => entry?.chainId === chainId,
				) ?? null)
			: null
	const fromNetwork = $derived(resolveNetwork(settings.fromChainId))
	const toNetwork = $derived(resolveNetwork(settings.toChainId))
	const fromDomain = $derived(getCctpDomainId(settings.fromChainId))
	const toDomain = $derived(getCctpDomainId(settings.toChainId))
	const cctpPairSupported = $derived(fromDomain !== null && toDomain !== null)
	const fastTransferSupported = $derived(
		settings.fromChainId !== null &&
			CCTP_FAST_TRANSFER_SOURCE_CHAIN_IDS.has(settings.fromChainId),
	)
	const effectiveTransferSpeed = $derived(
		fastTransferSupported ? settings.transferSpeed : TransferSpeed.Standard,
	)
	const forwardingSupported = $derived(
		settings.toChainId !== null &&
			CCTP_FORWARDING_CHAIN_IDS.has(settings.toChainId),
	)
	const minFinalityThreshold = $derived(
		effectiveTransferSpeed === TransferSpeed.Fast ? 1000 : 2000,
	)
	const feeBps = $derived(
		effectiveTransferSpeed === TransferSpeed.Fast
			? (feeFastBps ?? feeStandardBps ?? 0)
			: (feeStandardBps ?? feeFastBps ?? 0),
	)
	const apiHost = $derived(
		settings.isTestnet
			? 'https://iris-api-sandbox.circle.com'
			: 'https://iris-api.circle.com',
	)
	const expectedReceive = $derived(
		feeBps > 0 && settings.amount > 0n
			? settings.amount - (settings.amount * BigInt(feeBps)) / 10000n
			: settings.amount,
	)


	// Actions
	const onConfirmBridge = () => {
		confirmOpen = true
	}
	const onConfirmSubmit = () => {
		confirmOpen = false
		runExecutionAt = Date.now()
	}
	const onExecutionStatus = (
		step: 'burn' | 'attestation' | 'mint',
		status: 'pending' | 'done' | 'error',
		detail?: string,
	) => {
		if (status !== 'done') return
		if (step === 'burn' && detail?.startsWith('0x'))
			onExecutionSuccess?.({ txHash: detail as `0x${string}` })
	}
</script>


{#if recipient && fromNetwork && toNetwork}
	<div data-preview data-column>
		<strong>Transfer preview</strong>
		<dl class="bridge-summary">
			<dt>Burn</dt>
			<dd>
				{formatSmallestToDecimal(settings.amount, 6)} USDC on {fromNetwork.name}
			</dd>
			<dt>Receive</dt>
			<dd>
				~{formatSmallestToDecimal(expectedReceive, 6)} USDC on {toNetwork.name}
			</dd>
			{#if minOutput !== null}
				<dt>Min received</dt>
				<dd>{formatSmallestToDecimal(minOutput, 6)} USDC</dd>
			{/if}
			<dt>Recipient</dt>
			<dd>{formatAddress(recipient)}</dd>
		</dl>
	</div>
{/if}

<section data-card data-column>
	<h3>CCTP Execution</h3>
	{#if !fastTransferSupported}
		<p data-text="muted">Fast transfer is not supported for this source chain.</p>
	{/if}
	{#if forwardingSupported && settings.forwardingEnabled}
		<p data-text="muted">Forwarding service enabled.</p>
	{/if}

	<CctpFees
		{fromDomain}
		{toDomain}
		{apiHost}
		bind:fastBps={feeFastBps}
		bind:standardBps={feeStandardBps}
	/>

	<CctpAllowance {fastTransferSupported} {apiHost} />

	<div data-column>
		<CctpExecution
			bind:isExecuting={executing}
			{walletProvider}
			senderAddress={selectedActor}
			fromChainId={settings.fromChainId}
			toChainId={settings.toChainId}
			amount={settings.amount}
			mintRecipient={recipient ?? '0x0000000000000000000000000000000000000000'}
			{minFinalityThreshold}
			{feeBps}
			isTestnet={settings.isTestnet}
			runAt={runExecutionAt}
			onStatus={onExecutionStatus}
		/>
		<Button.Root
			type="button"
			disabled={!cctpPairSupported ||
				!recipient ||
				!selectedWallet ||
				isExecuting}
			onclick={onConfirmBridge}
		>
			Sign and Submit
		</Button.Root>
	</div>
</section>

<Dialog.Root bind:open={confirmOpen}>
	<Dialog.Portal>
		<Dialog.Content>
			<Dialog.Title>Confirm CCTP transfer</Dialog.Title>
			{#if fromNetwork && toNetwork && recipient}
				<Dialog.Description>
					Send {formatSmallestToDecimal(settings.amount, 6)} USDC from {fromNetwork.name}
					to {toNetwork.name}. Recipient: {formatAddress(recipient)}.
				</Dialog.Description>
			{/if}
			<div
				data-row
				class="dialog-actions"
			>
				<Button.Root
					type="button"
					onclick={() => {
						confirmOpen = false
					}}
				>Cancel</Button.Root>
				<Button.Root
					type="button"
					onclick={onConfirmSubmit}
				>Confirm</Button.Root>
			</div>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>


<style>
	.dialog-actions {
		margin-top: 1rem;
	}
</style>
