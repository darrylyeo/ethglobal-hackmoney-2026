<script lang="ts">
	// Types/constants
	import type { ApprovalState } from '$/lib/approval'
	import type { EIP1193Provider } from '$/lib/wallet'

	// Functions
	import {
		checkApproval,
		sendApproval,
		waitForApprovalConfirmation,
	} from '$/lib/approval'
	import { getTxUrl } from '$/constants/explorers'

	// Components
	import { Button, Switch } from 'bits-ui'

	// Props
	let {
		chainId,
		tokenAddress,
		spenderAddress,
		amount,
		walletProvider,
		walletAddress,
		onApproved,
	}: {
		chainId: number
		tokenAddress: `0x${string}`
		spenderAddress: `0x${string}`
		amount: bigint
		walletProvider: EIP1193Provider
		walletAddress: `0x${string}`
		onApproved: () => void
	} = $props()

	// State
	let _state = $state<ApprovalState>('unknown')
	let error = $state<string | null>(null)
	let txHash = $state<`0x${string}` | null>(null)
	let unlimited = $state(false)

	// (Derived)
	$effect(() => {
		void (chainId && tokenAddress && spenderAddress && walletAddress && (() => {
			_state = 'checking'
			error = null
			checkApproval(
				chainId,
				tokenAddress,
				walletAddress,
				spenderAddress,
				amount,
			).then((result) => {
				_state = result.state
				error = result.error ?? null
				if (result.state === 'approved') onApproved()
			})
		})())
	})

	// Actions
	const approve = async () => {
		_state = 'approving'
		error = null
		try {
			const hash = await sendApproval(
				walletProvider,
				chainId,
				tokenAddress,
				spenderAddress,
				amount,
				unlimited,
			)
			txHash = hash
			const success = await waitForApprovalConfirmation(chainId, hash)
			if (success) {
				_state = 'approved'
				onApproved()
			} else {
				_state = 'error'
				error = 'Approval transaction failed'
			}
		} catch (e) {
			_state = 'error'
			error = e instanceof Error ? e.message : String(e)
		}
	}

	const retry = () => {
		_state = 'checking'
		error = null
		checkApproval(
			chainId,
			tokenAddress,
			walletAddress,
			spenderAddress,
			amount,
		).then((result) => {
			_state = result.state
			error = result.error ?? null
			if (result.state === 'approved') onApproved()
		})
	}
</script>

<div data-approval data-state={_state} data-column="gap-2">
	{#if _state === 'checking'}
		<p>Checking approval…</p>
	{:else if _state === 'needed'}
		<div data-column="gap-3">
			<div data-row="gap-2 align-center" data-muted>
				<Switch.Root
					checked={unlimited}
					onCheckedChange={(c) => (unlimited = c)}
					aria-label="Unlimited approval"
				>
					<Switch.Thumb />
				</Switch.Root>
				<span>Unlimited approval</span>
			</div>
			{#if unlimited}
				<div data-security-warning data-card="secondary" data-column="gap-2" role="alert">
					<strong>⚠️ Unlimited approval</strong>
					<p>
						This allows the contract to spend any amount of your USDC.
						Consider using exact amount approval for better security.
					</p>
				</div>
			{/if}
			<Button.Root type="button" onclick={approve}>
				Approve USDC
			</Button.Root>
		</div>
	{:else if _state === 'approving'}
		<p>Approving…</p>
		{#if txHash}
			<a
				href={getTxUrl(chainId, txHash)}
				target="_blank"
				rel="noopener noreferrer"
				data-link
			>
				View transaction
			</a>
		{/if}
	{:else if _state === 'approved'}
		<p data-approval-success>✓ Approved</p>
	{:else if _state === 'error'}
		<p data-error role="alert">{error}</p>
		<Button.Root type="button" onclick={retry}>Retry</Button.Root>
	{/if}
</div>

<style>
	[data-security-warning] {
		background: var(--color-warning-bg, #fef3c7);
	}

	[data-approval-success] {
		color: var(--color-success, #22c55e);
	}
</style>
