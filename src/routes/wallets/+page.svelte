<script lang="ts">
	import { redirect } from '@sveltejs/kit'


	// Functions
	export function load() {
		redirect(302, '/accounts')
	}
</script>
