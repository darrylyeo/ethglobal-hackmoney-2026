<script lang="ts">
	// Types/constants
	import type { EIP1193Provider } from '$/lib/wallet.ts'
	import { executeGatewayTransfer } from '$/api/gateway-execution.ts'


	// Props
	let {
		walletProvider,
		senderAddress,
		fromChainId,
		toChainId,
		amount,
		recipient,
		isTestnet,
		needsDeposit,
		runAt = 0,
		isExecuting = $bindable(false),
		onStatus,
	}: {
		walletProvider: EIP1193Provider | null
		senderAddress: `0x${string}` | null
		fromChainId: number | null
		toChainId: number | null
		amount: bigint
		recipient: `0x${string}`
		isTestnet: boolean
		needsDeposit: boolean
		runAt?: number
		isExecuting?: boolean
		onStatus?: (
			step: 'deposit' | 'sign' | 'attestation' | 'mint',
			status: 'pending' | 'done' | 'error',
			detail?: string,
		) => void
	} = $props()


	// State
	let lastRunAt = $state(
		0
	)
	let depositTxHash = $state<string | null>(null)
	let mintTxHash = $state<string | null>(null)
	let error = $state<string | null>(null)
	let step = $state<
		'idle' | 'deposit' | 'sign' | 'attestation' | 'mint' | 'done'
	>('idle')


	async function execute() {
		if (
			!walletProvider ||
			senderAddress === null ||
			fromChainId === null ||
			toChainId === null
		) {
			error = 'Missing wallet or chain config'
			return
		}
		isExecuting = true
		error = null
		depositTxHash = null
		mintTxHash = null
		try {
			const result = await executeGatewayTransfer(
				{
					walletProvider,
					senderAddress,
					fromChainId,
					toChainId,
					amount,
					recipient,
					isTestnet,
					needsDeposit,
				},
				(s, status, detail) => {
					if (status === 'pending') step = s
					if (status === 'done' && s === 'mint') step = 'done'
					onStatus?.(s, status, detail)
					if (s === 'deposit' && status === 'done' && detail)
						depositTxHash = detail
					if (s === 'mint' && status === 'done' && detail)
						mintTxHash = detail
				},
			)
			if (result.depositTxHash) depositTxHash = result.depositTxHash
			mintTxHash = result.mintTxHash
			step = 'done'
		} catch (e) {
			error = e instanceof Error ? e.message : String(e)
			onStatus?.(
				step === 'deposit'
					? 'deposit'
					: step === 'sign'
						? 'sign'
						: step === 'attestation'
							? 'attestation'
							: 'mint',
				'error',
				error ?? undefined,
			)
		} finally {
			isExecuting = false
		}
	}

	$effect(() => {
		if (runAt > 0 && runAt !== lastRunAt) {
			lastRunAt = runAt
			execute()
		}
	})

	export { depositTxHash, mintTxHash, step, error, execute }
</script>


<div data-column>
	<strong>Status</strong>
	<ol class="gateway-status">
		{#if needsDeposit}
			<li
				class="gateway-status-step"
				data-done={step !== 'idle' && step !== 'deposit'}
			>
				Deposit on source chain {depositTxHash
					? `(${depositTxHash.slice(0, 10)}…)`
					: ''}
			</li>
		{/if}

		<li
			class="gateway-status-step"
			data-done={step !== 'idle' && step !== 'deposit' && step !== 'sign'}
		>
			Sign burn intent
		</li>

		<li
			class="gateway-status-step"
			data-done={step === 'mint' || step === 'done'}
		>
			Attestation
		</li>

		<li class="gateway-status-step" data-done={mintTxHash !== null}>
			Mint on destination {mintTxHash
				? `(${mintTxHash.slice(0, 10)}…)`
				: ''}
		</li>
	</ol>

	{#if error}
		<small data-error>{error}</small>
	{/if}
</div>


<style>
	.gateway-status {
		margin: 0;
		padding-inline-start: 1.2em;
	}

	.gateway-status-step {
		opacity: 0.7;
	}

	.gateway-status-step[data-done] {
		opacity: 1;
	}
</style>
