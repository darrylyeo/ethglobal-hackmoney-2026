<script lang="ts">


	// Types/constants
	import { fetchCctpMessages, getAttestationFromMessages } from '$/api/cctp.ts'


	// Props
	let {
		burnTxHash = $bindable(null as string | null),
		sourceDomain,
		apiHost,
		attestationPayload = $bindable(
			null as { message: string; attestation: string } | null,
		),
	}: {
		burnTxHash?: string | null
		sourceDomain: number | null
		apiHost: string
		attestationPayload?: { message: string; attestation: string } | null
	} = $props()


	// State
	let status = $state<'idle' | 'pending' | 'ready'>('idle')
	let error = $state<string | null>(null)

	$effect(() => {
		const txHash = burnTxHash
		const domain = sourceDomain
		if (txHash === null || domain === null) {
			status = 'idle'
			attestationPayload = null
			return
		}
		attestationPayload = null
		status = 'pending'
		error = null
		let cancelled = false
		const pollOnce = async () => {
			if (cancelled) return
			try {
				const data = await fetchCctpMessages(apiHost, domain, txHash)
				if (cancelled) return
				const payload = getAttestationFromMessages(data)
				if (payload) {
					status = 'ready'
					attestationPayload = payload
				}
			} catch (e) {
				if (!cancelled) error = e instanceof Error ? e.message : String(e)
			}
		}
		pollOnce()
		const interval = setInterval(pollOnce, 5000)
		return () => {
			cancelled = true
			clearInterval(interval)
		}
	})
</script>


<div data-column="gap-1">
	<strong>Attestation</strong>
	{#if status === 'idle'}
		<small data-muted
			>After burn, attestation will be polled automatically.</small
		>
	{:else if status === 'pending'}
		<small data-muted>Waiting for attestation… (404 treated as pending)</small>
	{:else if status === 'ready'}
		<small data-muted>Attestation ready. You can submit mint.</small>
	{:else if error}
		<small data-error>{error}</small>
	{/if}
</div>
