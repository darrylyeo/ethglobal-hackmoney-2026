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
	let state = $state<ApprovalState>('unknown')
	let error = $state<string | null>(null)
	let txHash = $state<`0x${string}` | null>(null)
	let unlimited = $state(false)

	// (Derived)
	$effect(() => {
		void (chainId && tokenAddress && spenderAddress && walletAddress && (() => {
			state = 'checking'
			error = null
			checkApproval(
				chainId,
				tokenAddress,
				walletAddress,
				spenderAddress,
				amount,
			).then((result) => {
				state = result.state
				error = result.error ?? null
				if (result.state === 'approved') onApproved()
			})
		})())
	})

	// Actions
	const approve = async () => {
		state = 'approving'
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
				state = 'approved'
				onApproved()
			} else {
				state = 'error'
				error = 'Approval transaction failed'
			}
		} catch (e) {
			state = 'error'
			error = e instanceof Error ? e.message : String(e)
		}
	}

	const retry = () => {
		state = 'checking'
		error = null
		checkApproval(
			chainId,
			tokenAddress,
			walletAddress,
			spenderAddress,
			amount,
		).then((result) => {
			state = result.state
			error = result.error ?? null
			if (result.state === 'approved') onApproved()
		})
	}
</script>

<div data-approval data-state={state}>
	{#if state === 'checking'}
		<p>Checking approval…</p>
	{:else if state === 'needed'}
		<div data-approval-controls>
			<div data-approval-toggle>
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
				<div data-security-warning role="alert">
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
	{:else if state === 'approving'}
		<p>Approving…</p>
		{#if txHash}
			<a
				href={getTxUrl(chainId, txHash)}
				target="_blank"
				rel="noopener noreferrer"
			>
				View transaction
			</a>
		{/if}
	{:else if state === 'approved'}
		<p data-approval-success>✓ Approved</p>
	{:else if state === 'error'}
		<p data-approval-error role="alert">{error}</p>
		<Button.Root type="button" onclick={retry}>Retry</Button.Root>
	{/if}
</div>

<style>
	[data-approval-controls] {
		display: flex;
		flex-direction: column;
		gap: 0.75em;
	}

	[data-approval-toggle] {
		display: flex;
		align-items: center;
		gap: 0.5em;
		font-size: 0.875em;
	}

	[data-approval-success] {
		color: var(--color-success, #22c55e);
	}

	[data-approval-error] {
		color: var(--color-error, #ef4444);
	}
</style>
