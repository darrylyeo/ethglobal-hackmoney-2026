<script lang="ts">
	// Components
	import Heading from '$/components/Heading.svelte'
</script>


<svelte:head>
	<title>EVM Signatures</title>
</svelte:head>


<main data-column="gap-4">
	<Heading>EVM Signatures</Heading>
	<p>
		Look up <strong>function</strong>, <strong>event</strong>, and <strong>error</strong> signatures
		from
		<a href="https://4byte.sourcify.dev/" target="_blank" rel="noopener noreferrer">4byte.sourcify.dev</a>
		and
		<a href="https://www.4byte.directory/docs/" target="_blank" rel="noopener noreferrer">4byte.directory</a>.
		Data is cached locally.
	</p>
	<ul role="list" data-column="gap-2">
		<li><a href="/evm/selectors">EVM selectors</a> — function selectors (4 bytes)</li>
		<li><a href="/evm/topics">EVM topics</a> — event topic hashes (32 bytes)</li>
		<li><a href="/evm/errors">EVM errors</a> — error selectors (4 bytes)</li>
		<li><a href="/calldata-decoder">Calldata decoder</a> — paste hex to decode</li>
	</ul>
</main>
