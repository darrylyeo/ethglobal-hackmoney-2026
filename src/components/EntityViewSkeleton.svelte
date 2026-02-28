<script lang="ts">
	// Components
	import Skeleton from '$/components/Skeleton.svelte'
</script>


<details
	data-card
	open
>
	<summary>
		<header data-row="wrap gap-4">
			<div data-row="start">
				<div
					data-row-item="flexible"
					data-column
				>
					<div data-row="start">
						<Skeleton
							width="12ch"
							height="1.5em"
							rounded="0.25em"
						/>
					</div>
				</div>
			</div>

			<div data-row>
				<Skeleton
					width="6ch"
					height="1em"
					rounded="0.25em"
				/>
			</div>
		</header>
	</summary>

	<div data-column="gap-4">
		<section data-column>
			<div
				data-card
				data-row
				class="loading"
			>
				<Skeleton
					width="100%"
					height="4em"
					rounded="0.5em"
				/>
			</div>

			<div
				data-card
				data-row
				class="loading"
			>
				<Skeleton
					width="100%"
					height="6em"
					rounded="0.5em"
				/>
			</div>
		</section>
	</div>
</details>


<style>
	.loading {
		cursor: wait;
	}
</style>
