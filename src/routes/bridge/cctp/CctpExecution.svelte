<script lang="ts">
	// Types/constants
	import type { EIP1193Provider } from '$/lib/wallet.ts'
	import {
		addressToBytes32,
		encodeDepositForBurn,
		encodeReceiveMessage,
		fetchCctpMessages,
		getAttestationFromMessages,
		zeroBytes32,
	} from '$/api/cctp.ts'
	import {
		checkApproval,
		sendApproval,
		waitForApprovalConfirmation,
	} from '$/api/approval.ts'
	import { getUsdcAddress } from '$/api/lifi.ts'
	import {
		getCctpDomainId,
		getCctpTokenMessenger,
		getCctpMessageTransmitter,
	} from '$/constants/cctp.ts'
	import { switchWalletChain } from '$/lib/wallet.ts'


	// Props
	let {
		walletProvider,
		senderAddress,
		fromChainId,
		toChainId,
		amount,
		mintRecipient,
		minFinalityThreshold,
		feeBps,
		isTestnet,
		runAt = 0,
		executing = $bindable(false),
		onStatus,
	}: {
		walletProvider: EIP1193Provider | null,
		senderAddress: `0x${string}` | null,
		fromChainId: number | null,
		toChainId: number | null,
		amount: bigint,
		mintRecipient: `0x${string}`,
		minFinalityThreshold: number,
		feeBps: number,
		isTestnet: boolean,
		runAt?: number,
		executing?: boolean,
		onStatus?: (
			step: 'burn' | 'attestation' | 'mint',
			status: 'pending' | 'done' | 'error',
			detail?: string,
		) => void,
	} = $props()


	// State
	let lastRunAt = $state(0)
	let burnTxHash = $state<string | null>(null)
	let attestationPayload = $state<{
		message: string
		attestation: string
	} | null>(null)
	let mintTxHash = $state<string | null>(null)
	let error = $state<string | null>(null)
	let step = $state<
		'idle' | 'approving' | 'burning' | 'attestation' | 'minting' | 'done'
	>('idle')


	// (Derived)
	const tokenMessenger = $derived(getCctpTokenMessenger(fromChainId, isTestnet))
	const messageTransmitterDest = $derived(
		getCctpMessageTransmitter(toChainId, isTestnet),
	)
	const burnToken = $derived(
		fromChainId !== null ? getUsdcAddress(fromChainId) : null,
	)
	const destinationDomain = $derived(getCctpDomainId(toChainId))
	const fromDomain = $derived(getCctpDomainId(fromChainId))

	const apiHost = $derived(
		isTestnet
			? 'https://iris-api-sandbox.circle.com'
			: 'https://iris-api.circle.com',
	)


	// Functions
	async function pollAttestation(): Promise<{
		message: string
		attestation: string
	}> {
		if (burnTxHash === null || fromDomain === null)
			throw new Error('Missing burn tx or domain')
		for (let i = 0; i < 120; i++) {
			const data = await fetchCctpMessages(apiHost, fromDomain, burnTxHash)
			const payload = getAttestationFromMessages(data)
			if (payload) return payload
			onStatus?.('attestation', 'pending')
			await new Promise((r) => setTimeout(r, 5000))
		}
		throw new Error('Attestation timeout')
	}


	// Actions
	async function execute() {
		if (
			!walletProvider ||
			senderAddress === null ||
			fromChainId === null ||
			toChainId === null ||
			tokenMessenger === null ||
			messageTransmitterDest === null ||
			burnToken === null ||
			destinationDomain === null ||
			fromDomain === null
		) {
			error = 'Missing wallet or chain config'
			return
		}
		executing = true
		error = null
		burnTxHash = null
		attestationPayload = null
		mintTxHash = null
		try {
			await switchWalletChain(walletProvider, fromChainId)
			step = 'approving'
			onStatus?.('burn', 'pending')
			const approval = await checkApproval(
				fromChainId,
				burnToken,
				senderAddress,
				tokenMessenger,
				amount,
			)
			if (approval.state === 'needed') {
				const approveHash = await sendApproval(
					walletProvider,
					fromChainId,
					burnToken,
					tokenMessenger,
					amount,
					true,
				)
				await waitForApprovalConfirmation(fromChainId, approveHash)
			}
			step = 'burning'
			const maxFee = (amount * BigInt(feeBps)) / 10000n
			const mintRecipientBytes32 = addressToBytes32(mintRecipient)
			const data = encodeDepositForBurn(
				amount,
				destinationDomain,
				mintRecipientBytes32,
				burnToken,
				zeroBytes32(),
				maxFee,
				minFinalityThreshold,
			)
			const hash = (await walletProvider.request({
				method: 'eth_sendTransaction',
				params: [
					{
						to: tokenMessenger,
						data,
						chainId: `0x${fromChainId.toString(16)}`,
					},
				],
			})) as string
			burnTxHash = hash
			onStatus?.('burn', 'done', hash)
			step = 'attestation'
			const payload = await pollAttestation()
			attestationPayload = payload
			onStatus?.('attestation', 'done')
			step = 'minting'
			onStatus?.('mint', 'pending')
			await switchWalletChain(walletProvider, toChainId)
			const mintData = encodeReceiveMessage(
				payload.message as `0x${string}`,
				payload.attestation as `0x${string}`,
			)
			const mintHash = (await walletProvider.request({
				method: 'eth_sendTransaction',
				params: [
					{
						to: messageTransmitterDest,
						data: mintData,
						chainId: `0x${toChainId.toString(16)}`,
					},
				],
			})) as string
			mintTxHash = mintHash
			onStatus?.('mint', 'done', mintHash)
			step = 'done'
		} catch (e) {
			error = e instanceof Error ? e.message : String(e)
			onStatus?.(
				step === 'burning'
					? 'burn'
					: step === 'attestation'
						? 'attestation'
						: 'mint',
				'error',
				error ?? undefined,
			)
		} finally {
			executing = false
		}
	}

	$effect(() => {
		if (runAt > 0 && runAt !== lastRunAt) {
			lastRunAt = runAt
			execute()
		}
	})

	export { burnTxHash, attestationPayload, mintTxHash, step, error, execute }
</script>


<div data-column="gap-2">
	<strong>Status</strong>
	<ol class="cctp-status">
		<li
			class="cctp-status-step"
			data-done={step !== 'idle' && step !== 'approving' && step !== 'burning'}
		>
			Burn on source chain {burnTxHash ? `(${burnTxHash.slice(0, 10)}…)` : ''}
		</li>
		<li
			class="cctp-status-step"
			data-done={attestationPayload !== null}
		>
			Attestation {attestationPayload ? 'ready' : 'pending…'}
		</li>
		<li
			class="cctp-status-step"
			data-done={mintTxHash !== null}
		>
			Mint on destination chain {mintTxHash
				? `(${mintTxHash.slice(0, 10)}…)`
				: ''}
		</li>
	</ol>
	{#if error}
		<small data-error>{error}</small>
	{/if}
</div>


<style>
	.cctp-status {
		margin: 0;
		padding-inline-start: 1.2em;
	}

	.cctp-status-step {
		opacity: 0.7;

		&[data-done] {
			opacity: 1;
		}
	}
</style>
