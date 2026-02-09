<script lang="ts">
	// Constants
	import { storkRestBaseUrl } from '$/constants/stork.ts'
	import { proxyFetch } from '$/lib/proxyFetch.ts'
	import { env } from '$env/dynamic/public'

	// State
	let result = $state<{ ok: boolean; status: number; body: string } | null>(null)
	let loading = $state(false)

	// Actions
	const fetchStork = async () => {
		result = null
		loading = true
		const token = env.PUBLIC_STORK_REST_TOKEN
		const res = await proxyFetch(
			`${storkRestBaseUrl}/v1/prices/latest?assets=ETHUSD,BTCUSD,USDCUSD`,
			token ? { headers: { Authorization: `Basic ${token}` } } : {},
		)
		const body = await res.text()
		result = { ok: res.ok, status: res.status, body }
		loading = false
	}
</script>


<main
	id="main"
	data-column
	data-sticky-container
>
	<section data-scroll-item>
		<h1>Stork API test</h1>
		<section data-card data-column aria-labelledby="stork-heading">
			<h2 id="stork-heading">REST (frontend → Stork directly)</h2>
			<p>
				{storkRestBaseUrl}/v1/prices/latest
			</p>
			<button
				type="button"
				disabled={loading}
				onclick={fetchStork}
			>
				{loading ? 'Loading…' : 'Fetch prices'}
			</button>
			{#if result}
				<pre
					style="white-space: pre-wrap; word-break: break-all; max-height: 24em; overflow: auto;"
				>
					{result.ok ? 'OK' : 'Error'} {result.status} — {result.body}
				</pre>
			{/if}
		</section>
	</section>
</main>
