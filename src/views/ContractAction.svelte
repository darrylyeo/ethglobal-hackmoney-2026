<script lang="ts">
	// Types/constants
	import type { ChainId } from '$/constants/networks.ts'
	import type { ContractAbi } from '$/data/Contract.ts'
	import type { EIP1193Provider } from '$/lib/wallet.ts'
	import { WalletConnectionTransport } from '$/data/WalletConnection.ts'
	import { encodeFunction, decodeParameters } from '@tevm/voltaire/Abi'
	import { toBytes } from '@tevm/voltaire/Hex'
	import { isReadable, isReadableWithoutInputs, isWritable } from '$/lib/abi.ts'
	import { ethCall } from '$/api/voltaire.ts'
	import { runTevmSimulationFromClient } from '$/api/tevm/tevmSimulation.ts'
	import { createProviderForChain, getEffectiveRpcUrl } from '$/lib/helios-rpc.ts'
	import { PatternType } from '$/constants/patterns.ts'
	import { eq, and, useLiveQuery } from '@tanstack/svelte-db'
	import { walletConnectionsCollection } from '$/collections/WalletConnections.ts'
	import { walletsCollection } from '$/collections/Wallets.ts'
	import { normalizeAddress } from '$/lib/address.ts'
	import { TevmSimulationSummaryStatus } from '$/data/TevmSimulationResult.ts'


	// Components
	import Select from '$/components/Select.svelte'
	import PatternInput from '$/components/PatternInput.svelte'


	// Props
	let {
		chainId,
		address,
		abi,
		contractName,
		from: fromProp,
	}: {
		chainId: ChainId
		address: `0x${string}`
		abi: ContractAbi
		contractName?: string
		from?: `0x${string}` | null
	} = $props()


	// (Derived)
	type AbiFn = (typeof abi)[number] & { type: 'function' }
	const functions = $derived(
		abi.filter((x): x is AbiFn => x.type === 'function') as AbiFn[],
	)
	const variables = $derived(
		functions.filter((f) => isReadableWithoutInputs(f)),
	)
	const queries = $derived(
		functions.filter((f) => isReadable(f) && !isReadableWithoutInputs(f)),
	)
	const actions = $derived(
		functions.filter((f) => isWritable(f)),
	)
	const rpcUrl = $derived(getEffectiveRpcUrl(chainId) ?? null)
	const methodItems = $derived([...variables, ...queries, ...actions])

	const connectionsQuery = useLiveQuery(
		(q) =>
			q
				.from({ row: walletConnectionsCollection })
				.where(({ row }) => eq(row.transport, WalletConnectionTransport.Eip1193))
				.select(({ row }) => ({ row })),
		[],
	)
	const walletsQuery = useLiveQuery(
		(q) => q.from({ row: walletsCollection }).select(({ row }) => ({ row })),
		[],
	)
	const selectedConnection = $derived(
		(connectionsQuery.data ?? [])
			.map((r) => r.row)
			.find((c) => c.selected),
	)
	const walletRow = $derived(
		selectedConnection ?
			(walletsQuery.data ?? []).map((r) => r.row).find(
				(w) => w.$id.rdns === selectedConnection.$id.wallet$id.rdns,
			)
		: null,
	)
	const walletProvider = $derived(
		fromProp ?
			null
		: (selectedConnection &&
			walletRow &&
			'provider' in walletRow &&
			(walletRow.provider as EIP1193Provider)) ?? null,
	)
	const fromAddress = $derived(
		fromProp ?? selectedConnection?.activeActor ?? selectedConnection?.actors[0] ?? null,
	)


	// State
	let selectedMethod = $state<AbiFn | undefined>(undefined)
	$effect(() => {
		const methods = methodItems
		const current = selectedMethod
		if (methods.length > 0 && !current)
			selectedMethod = methods[0] as AbiFn
		else if (current && !methods.some((m) => m.name === current.name))
			selectedMethod = (methods[0] as AbiFn) ?? undefined
	})
	let inputValues = $state<Record<string, string>>({})
	let payableValue = $state(0n)
	let queryResult = $state<unknown[] | string | null>(null)
	let simulateResult = $state<{ status: string; error?: string } | null>(null)
	let simulateInProgress = $state(false)
	let queryInProgress = $state(false)
	let broadcastInProgress = $state(false)


	// Actions
	const getInputKey = (name: string, i: number) => `${selectedMethod?.name ?? ''}/${name || i}`

	const coerceArg = (value: string, type: string): unknown => {
		if (type === 'address') return normalizeAddress(value) ?? value
		if (type.startsWith('uint') || type.startsWith('int')) return BigInt(value || 0)
		if (type === 'bool') return value === 'true' || value === '1'
		return value
	}

	const getEncodedData = () => {
		if (!selectedMethod) return null
		const inputs = selectedMethod.inputs ?? []
		const args = inputs.map((inp, i) => {
			const key = getInputKey(inp.name || `param${i}`, i)
			return coerceArg(inputValues[key] ?? '', inp.type)
		})
		try {
			return encodeFunction(abi, selectedMethod.name, args) as `0x${string}`
		} catch {
			return null
		}
	}

	const runSimulate = async () => {
		const data = getEncodedData()
		if (!rpcUrl || !data) return
		simulateInProgress = true
		simulateResult = null
		try {
			const { result } = await runTevmSimulationFromClient({
				rpcUrl,
				chainId,
				from: fromAddress ?? ('0x0000000000000000000000000000000000000001' as `0x${string}`),
				to: address,
				data,
				value: payableValue > 0n ? `0x${payableValue.toString(16)}` : undefined,
			})
			const status =
				(result as { summaryStatus?: string }).summaryStatus ??
				(result as { revertReason?: string }).revertReason
					? TevmSimulationSummaryStatus.Failed
					: TevmSimulationSummaryStatus.Success
			const err =
				(result as { revertReason?: string }).revertReason ??
				(result as { error?: string }).error
			simulateResult = { status, ...(err && { error: err }) }
		} catch (e) {
			simulateResult = {
				status: TevmSimulationSummaryStatus.Failed,
				error: e instanceof Error ? e.message : String(e),
			}
		} finally {
			simulateInProgress = false
		}
	}

	const runQuery = async () => {
		const data = getEncodedData()
		if (!rpcUrl || !data) return
		queryInProgress = true
		queryResult = null
		try {
			const provider = createProviderForChain(chainId)
			const result = await ethCall(provider, { to: address, data })
			if (!selectedMethod?.outputs?.length) {
				queryResult = result
				return
			}
			const decoded = decodeParameters(selectedMethod.outputs, toBytes(result))
			queryResult = decoded
		} catch (e) {
			queryResult = e instanceof Error ? e.message : String(e)
		} finally {
			queryInProgress = false
		}
	}

	const runBroadcast = async () => {
		if (!walletProvider || !fromAddress) return
		const data = getEncodedData()
		if (!data) return
		broadcastInProgress = true
		try {
			await walletProvider.request({
				method: 'eth_sendTransaction',
				params: [
					{
						from: fromAddress,
						to: address,
						data,
						value: payableValue > 0n ? `0x${payableValue.toString(16)}` : undefined,
						chainId: `0x${chainId.toString(16)}`,
					},
				],
			})
			simulateResult = { status: 'Broadcast' }
		} catch (e) {
			simulateResult = {
				status: TevmSimulationSummaryStatus.Failed,
				error: e instanceof Error ? e.message : String(e),
			}
		} finally {
			broadcastInProgress = false
		}
	}

	const isReadOnly = $derived(selectedMethod && isReadable(selectedMethod))
</script>


	<details>
		<summary data-row="gap-2 justify-between">
			<h3>Smart Contract Interactions</h3>
		</summary>

		<div data-column="gap-4">
		<section data-card data-column>
			<h4>Method</h4>
			<Select
				items={methodItems}
				bind:value={selectedMethod}
				getItemId={(m: AbiFn) => m.name}
				getItemLabel={(m: AbiFn) => m.name}
				getItemGroupId={(m: AbiFn) =>
					variables.includes(m) ?
						'Variables'
					: queries.includes(m) ?
						'Queries'
					: 'Actions'}
				placeholder="Select method"
				ariaLabel="Method"
			/>
		</section>

		{#if selectedMethod}
			<section data-card data-column>
				<h4>Parameters</h4>
				{#each (selectedMethod.inputs ?? []) as input, i}
					{@const key = getInputKey(input.name ?? `param${i}`, i)}
					<label data-row="gap-2">
						<span>{input.name ?? `Param ${i + 1}`}</span>
						{#if input.type === 'address'}
							<PatternInput
								patternTypes={[PatternType.EvmAddress, PatternType.EnsName]}
								bind:value={() => inputValues[key] ?? '', (v) => (inputValues = { ...inputValues, [key]: v })}
							/>
						{:else if input.type.startsWith('uint') || input.type.startsWith('int')}
							<input
								type="text"
								placeholder="0"
								bind:value={() => inputValues[key] ?? '', (v) => (inputValues = { ...inputValues, [key]: v })}
							/>
						{:else if input.type === 'bool'}
							<select
								bind:value={() => inputValues[key] ?? 'false', (v) => (inputValues = { ...inputValues, [key]: v })}
							>
								<option value="false">false</option>
								<option value="true">true</option>
							</select>
						{:else}
							<input
								type="text"
								bind:value={() => inputValues[key] ?? '', (v) => (inputValues = { ...inputValues, [key]: v })}
							/>
						{/if}
						<span data-text="muted">{input.type}</span>
					</label>
				{/each}
				{#if selectedMethod.stateMutability === 'payable'}
					<label data-row="gap-2">
						<span>Value (wei)</span>
						<input
							type="text"
							placeholder="0"
							bind:value={() => payableValue.toString(), (v) => (payableValue = BigInt(v || 0))}
						/>
					</label>
				{/if}
			</section>

			<section data-card data-column>
				<h4>Execute</h4>
				<div data-row="gap-2">
					{#if isReadOnly}
						<button
							disabled={!getEncodedData() || !rpcUrl || simulateInProgress}
							onclick={runSimulate}
						>
							{simulateInProgress ? 'Simulating…' : 'Simulate'}
						</button>
						<button
							disabled={!getEncodedData() || !rpcUrl || queryInProgress}
							onclick={runQuery}
						>
							{queryInProgress ? 'Querying…' : 'Query'}
						</button>
					{:else}
						<button
							disabled={!getEncodedData() || !rpcUrl || simulateInProgress}
							onclick={runSimulate}
						>
							{simulateInProgress ? 'Simulating…' : 'Simulate'}
						</button>
						<button
							disabled={
								!getEncodedData() ||
								!walletProvider ||
								!fromAddress ||
								broadcastInProgress
							}
							onclick={runBroadcast}
						>
							{broadcastInProgress ? 'Broadcasting…' : 'Sign & Broadcast'}
						</button>
					{/if}
				</div>
			</section>

			{#if queryResult != null}
				<section data-card>
					<h4>Result</h4>
					{#if Array.isArray(queryResult)}
						{#each queryResult as val, i}
							<output>{String(val)}</output>
						{/each}
					{:else}
						<output>{String(queryResult)}</output>
					{/if}
				</section>
			{/if}

			{#if simulateResult}
				<section data-card>
					<h4>Simulation</h4>
					<p
						data-tag={simulateResult.status === TevmSimulationSummaryStatus.Success ?
							'success'
						: 'failure'}
					>
						{simulateResult.status}
						{#if simulateResult.error}
							: {simulateResult.error}
						{/if}
					</p>
				</section>
			{/if}
		{/if}
		</div>
	</details>
