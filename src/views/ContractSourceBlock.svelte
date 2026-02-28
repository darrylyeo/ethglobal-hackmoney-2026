<script lang="ts">
	// Components
	import Code from '$/components/Code.svelte'


	// Props
	let {
		path,
		content,
	}: {
		path: string
		content: string
	} = $props()
</script>


<Code {path} {content} maxHeight="20em" />
