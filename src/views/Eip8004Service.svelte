<script lang="ts">
	// Types/constants
	import type { Eip8004Service } from '$/data/Eip8004Service.ts'
	import { eip8004ServiceIdToString } from '$/data/Eip8004Service.ts'
	import { ipfsUriToHttp } from '$/api/eip-8004.ts'

	// Props
	let { service }: { service: Eip8004Service } = $props()

	// (Derived)
	const serviceRef = $derived(
		`@Service:${service.$id.identityId}`
	)
	const serviceHref = $derived(
		`/agents?ref=${encodeURIComponent(eip8004ServiceIdToString(service.$id))}`,
	)
	const imageSrc = $derived(
		service.image ? ipfsUriToHttp(service.image) : null
	)
	const hasCapabilities = $derived(
		service.services != null && service.services.length > 0
	)
</script>


<div data-column="gap-3">
	{#if imageSrc}
		<p>
			<img
				src={imageSrc}
				alt=""
				width="64"
				height="64"
				style="border-radius: 50%; object-fit: cover;"
			/>
		</p>
	{/if}
	{#if service.description}
		<p>{service.description}</p>
	{/if}
	{#if service.contactEndpoint}
		<p>
			<strong>Contact:</strong>
			<a
				href={service.contactEndpoint}
				target="_blank"
				rel="noopener noreferrer"
				data-link
			>
				{service.contactEndpoint}
			</a>
		</p>
	{/if}
	{#if hasCapabilities}
		<dl data-definition-list="vertical">
			<dt>Services</dt>
			<dd>
				<ul role="list" data-column="gap-0.5">
					{#each service.services! as svc}
						<li>
							{svc.name ?? svc.type}
							{#if svc.url}
								—
								<a
									href={svc.url.startsWith('http') ? svc.url : ipfsUriToHttp(svc.url)}
									target="_blank"
									rel="noopener noreferrer"
									data-link
								>
									{svc.url}
								</a>
							{/if}
						</li>
					{/each}
				</ul>
			</dd>
		</dl>
	{/if}
	{#if service.registrationUri}
		<p>
			<a
				href={service.registrationUri.startsWith('http') ? service.registrationUri : ipfsUriToHttp(service.registrationUri)}
				target="_blank"
				rel="noopener noreferrer"
				data-link
			>
				View registration document
			</a>
		</p>
	{/if}
	<p>
		<a href={serviceHref} data-link>
			Use in chat
		</a>
		— reference as {serviceRef} in agent conversations.
	</p>
</div>
