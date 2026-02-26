/**
 * Run a transaction in a Tevm-forked node and return result with fork metadata,
 * status, gas, trace, and events. Runs client-side in browser (tevm fork uses
 * http transport to RPC).
 */

import {
	TevmSimulationSummaryStatus,
	type TevmSimulationDecodedEvent,
	type TevmSimulationResult,
	type TevmSimulationTraceCall,
} from '$/data/TevmSimulationResult.ts'

const toHex = (bytes: Uint8Array): string =>
	`0x${Array.from(bytes)
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('')}`

const toHexSafe = (
	val: Uint8Array | string | undefined | null,
): string =>
	val == null ?
		'0x'
	: typeof val === 'string' ?
		val
	: toHex(val)

export type SimulatePayload = {
	rpcUrl: string
	chainId: number
	from: string
	to?: string
	data?: string
	value?: string
	gasLimit?: string
	blockTag?: number | 'latest'
}

function buildResult(
	body: SimulatePayload,
	runResult: { execResult: { exceptionError?: unknown; returnValue?: Uint8Array; logs?: unknown }; totalGasSpent: bigint; gasRefund?: bigint },
	value: bigint,
	forkBlockNumber: number,
): TevmSimulationResult {
	const execResult = runResult.execResult
	const reverted = Boolean(execResult.exceptionError)
	const errMessage =
		(execResult.exceptionError as unknown as { error?: { message?: string } } | undefined)
			?.error?.message
	const summaryStatus: TevmSimulationResult['summaryStatus'] = (
		reverted ?
			(errMessage?.toLowerCase().includes('revert')
				? TevmSimulationSummaryStatus.Revert
				: TevmSimulationSummaryStatus.Error)
		:
			TevmSimulationSummaryStatus.Success
	)

	let revertReason: string | undefined
	let errorSelector: string | undefined
	const returnValue =
		execResult.returnValue instanceof Uint8Array ? execResult.returnValue : undefined
	if (execResult.exceptionError && returnValue && returnValue.length >= 4) {
		errorSelector = toHex(returnValue.slice(0, 4))
		if (returnValue.length > 4) revertReason = toHex(returnValue)
	}
	if (!revertReason && execResult.exceptionError) {
		revertReason =
			(execResult.exceptionError as unknown as { error?: { message?: string } })
				.error?.message ?? String(execResult.exceptionError)
	}

	const data = (body.data ?? '0x') as string
	const trace: TevmSimulationTraceCall[] = [
		{
			to: body.to ?? '',
			data: body.data ?? '0x',
			value: value.toString(),
			gasUsed: runResult.totalGasSpent.toString(),
			revert: revertReason,
			selector: data.length >= 10 ? data.slice(0, 10) : undefined,
		},
	]

	const logs = (execResult.logs ?? []) as unknown as {
		address?: Uint8Array | string
		topics?: (Uint8Array | string)[]
		data?: Uint8Array | string
	}[]
	const rawLogs = logs
		.filter((log) => log?.address != null && log?.data != null)
		.map((log) => ({
			address: toHexSafe(log!.address),
			topics: (log!.topics ?? []).map((t) => toHexSafe(t)),
			data: toHexSafe(log!.data),
		}))

	const events: TevmSimulationDecodedEvent[] = rawLogs.map((log) => ({
		address: log.address,
		topics: log.topics,
		data: log.data,
	}))

	return {
		forkMetadata: {
			blockNumber: forkBlockNumber,
			rpcUrl: body.rpcUrl,
			timestamp: Date.now(),
		},
		summaryStatus,
		gasTotals: {
			used: runResult.totalGasSpent.toString(),
			refund: runResult.gasRefund?.toString(),
		},
		revertReason,
		errorSelector,
		trace,
		events,
		rawLogs,
	}
}

export const runTevmSimulation = async (
	body: SimulatePayload,
): Promise<TevmSimulationResult> => {
	const { createTevmNode, http, getAddress } = await import('tevm')
	const { createImpersonatedTx } = await import('tevm/tx')
	const { createCommon, mainnet } = await import('tevm/common')

	const blockTag = body.blockTag ?? 'latest'
	const node = createTevmNode({
		fork: {
			transport: http(body.rpcUrl)({}),
			blockTag: typeof blockTag === 'number' ? BigInt(blockTag) : blockTag,
		},
	})
	await node.ready()

	const vm = await node.getVm()
	const fromAddress = getAddress(body.from as `0x${string}`)

	node.setImpersonatedAccount(
		fromAddress as unknown as Parameters<typeof node.setImpersonatedAccount>[0],
	)

	const value = body.value ? BigInt(body.value) : 0n
	const gasLimit = body.gasLimit ? BigInt(body.gasLimit) : 3_000_000n
	const data = (body.data ?? '0x') as `0x${string}`
	const to = body.to ? getAddress(body.to as `0x${string}`) : undefined

	const common = createCommon({ ...mainnet, id: body.chainId })
	const ethjsCommon =
		'ethjsCommon' in common && common.ethjsCommon ? common.ethjsCommon : common

	type TevmAddress = Parameters<typeof createImpersonatedTx>[0]['impersonatedAddress']
	const tx = createImpersonatedTx(
		{
			chainId: BigInt(body.chainId),
			to,
			data,
			value,
			gasLimit,
			maxFeePerGas: 10n ** 9n,
			maxPriorityFeePerGas: 10n ** 8n,
			nonce: 0n,
			impersonatedAddress: fromAddress as unknown as TevmAddress,
		},
		{ common: ethjsCommon },
	)

	const runResult = await vm.runTx({
		tx,
		skipBalance: true,
		skipNonce: true,
	})

	const forkBlockNumber = typeof blockTag === 'number' ? blockTag : 0
	return buildResult(body, runResult, value, forkBlockNumber)
}

/** Run multiple payloads on the same fork in order; state from each tx is applied before the next. All payloads must use the same rpcUrl and chainId. */
export const runTevmSimulationSequence = async (
	bodies: SimulatePayload[],
): Promise<TevmSimulationResult[]> => {
	if (bodies.length === 0) return []
	if (bodies.length === 1) return [await runTevmSimulation(bodies[0])]

	const { createTevmNode, http, getAddress } = await import('tevm')
	const { createImpersonatedTx } = await import('tevm/tx')
	const { createCommon, mainnet } = await import('tevm/common')

	const first = bodies[0]
	const blockTag = first.blockTag ?? 'latest'
	const node = createTevmNode({
		fork: {
			transport: http(first.rpcUrl)({}),
			blockTag: typeof blockTag === 'number' ? BigInt(blockTag) : blockTag,
		},
	})
	await node.ready()

	const vm = await node.getVm()
	const common = createCommon({ ...mainnet, id: first.chainId })
	const ethjsCommon =
		'ethjsCommon' in common && common.ethjsCommon ? common.ethjsCommon : common
	const forkBlockNumber = typeof blockTag === 'number' ? blockTag : 0
	const results: TevmSimulationResult[] = []

	for (let i = 0; i < bodies.length; i++) {
		const body = bodies[i]
		const fromAddress = getAddress(body.from as `0x${string}`)

		node.setImpersonatedAccount(
			fromAddress as unknown as Parameters<typeof node.setImpersonatedAccount>[0],
		)

		const value = body.value ? BigInt(body.value) : 0n
		const gasLimit = body.gasLimit ? BigInt(body.gasLimit) : 3_000_000n
		const data = (body.data ?? '0x') as `0x${string}`
		const to = body.to ? getAddress(body.to as `0x${string}`) : undefined

		type TevmAddress = Parameters<typeof createImpersonatedTx>[0]['impersonatedAddress']
		const tx = createImpersonatedTx(
			{
				chainId: BigInt(body.chainId),
				to,
				data,
				value,
				gasLimit,
				maxFeePerGas: 10n ** 9n,
				maxPriorityFeePerGas: 10n ** 8n,
				nonce: BigInt(i),
				impersonatedAddress: fromAddress as unknown as TevmAddress,
			},
			{ common: ethjsCommon },
		)

		const runResult = await vm.runTx({
			tx,
			skipBalance: true,
			skipNonce: true,
		})

		results.push(buildResult(body, runResult, value, forkBlockNumber))

		if (results[results.length - 1].summaryStatus !== TevmSimulationSummaryStatus.Success) break
	}

	return results
}
