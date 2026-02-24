<script lang="ts">
	import { seedEvmSignatureCollections } from '$/lib/evm-signature-seed.ts'

	let { children } = $props()

	$effect(() => {
		seedEvmSignatureCollections()
	})
</script>

{@render children()}
