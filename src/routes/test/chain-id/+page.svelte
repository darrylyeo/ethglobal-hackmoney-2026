<script lang="ts">
	// Functions
	import { Button } from 'bits-ui'
	import { createHttpProvider, getChainId } from '$/api/voltaire.ts'
	import { formatInteger } from '$/lib/format.ts'


	// State
	let rpcUrl = $state('')
	let chainIdResult = $state<string | null>(null)
	let loading = $state(false)
	let error = $state<string | null>(null)


	// Actions
	async function submit() {
		if (!rpcUrl.trim()) return
		error = null
		chainIdResult = null
		loading = true
		try {
			const chainId = await getChainId(createHttpProvider(rpcUrl.trim()))
			chainIdResult = String(chainId)
		} catch (e) {
			error = e instanceof Error ? e.message : String(e)
		} finally {
			loading = false
		}
	}
</script>


<main
	id="main"
	data-column
	data-sticky-container
>
	<section data-scroll-item>
		<h1>Tests</h1>
		<section
			data-card
			data-column="gap-4"
			aria-labelledby="chainid-heading"
		>
			<h2 id="chainid-heading">Chain ID (Voltaire)</h2>
			<form
				aria-labelledby="chainid-heading"
				onsubmit={(e) => {
					e.preventDefault()
					submit()
				}}
			>
				<fieldset data-row>
					<legend class="sr-only">RPC URL</legend>
					<label
						for="rpc-url"
						class="sr-only"
					>RPC URL</label>
					<div
						data-column
						data-row-item="flexible"
					>
						<input
							id="rpc-url"
							type="url"
							bind:value={rpcUrl}
							placeholder="RPC URL (https://…)"
						/>
					</div>
					<Button.Root
						type="submit"
						disabled={loading || !rpcUrl.trim()}
					>
						{loading ? 'Loading…' : 'Get chain ID'}
					</Button.Root>
				</fieldset>
			</form>
			{#if error}
				<p role="alert">{error}</p>
			{/if}
			{#if chainIdResult !== null}
				<p>
					<output for="rpc-url">Chain ID: {formatInteger(chainIdResult)}</output>
				</p>
			{/if}
		</section>
	</section>
</main>
