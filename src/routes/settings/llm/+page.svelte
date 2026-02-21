<script lang="ts">
	// Types/constants


	// Components
	import LlmConnections from './LlmConnections.svelte'
</script>


<main data-column>
	<header data-column>
		<h1>LLM connections</h1>
		<p data-text="muted">
			Configure API keys and default models for OpenAI, Anthropic, Google, Zen, and self-hosted providers.
		</p>
	</header>
	<LlmConnections />
</main>

