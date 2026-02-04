/**
 * POST /api/simulate – run a transaction in a Tevm-forked node and return
 * result with fork metadata, status, gas, trace, and events.
 * Body: { rpcUrl: string, chainId: number, from: string, to?: string, data?: string, value?: string, gasLimit?: string, blockTag?: number | 'latest' }
 */

import type {
	TevmSimulationDecodedEvent,
	TevmSimulationResult,
	TevmSimulationTraceCall,
} from '$/data/TevmSimulationResult'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

const toHex = (bytes: Uint8Array): string =>
	`0x${Array.from(bytes)
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('')}`

const runTevmSimulation = async (body: {
	rpcUrl: string
	chainId: number
	from: string
	to?: string
	data?: string
	value?: string
	gasLimit?: string
	blockTag?: number | 'latest'
}): Promise<TevmSimulationResult> => {
	const { createTevmNode, http, createAddress } = await import('tevm')
	const { createImpersonatedTx } = await import('tevm/tx')
	const { bytesToHex } = await import('tevm/utils')

	const blockTag = body.blockTag ?? 'latest'
	const node = createTevmNode({
		fork: {
			transport: http(body.rpcUrl)({}),
			blockTag: typeof blockTag === 'number' ? BigInt(blockTag) : blockTag,
		},
	})
	await node.ready()

	const vm = await node.getVm()
	const fromAddress = createAddress(body.from)

	node.setImpersonatedAccount(fromAddress)

	const value = body.value ? BigInt(body.value) : 0n
	const gasLimit = body.gasLimit ? BigInt(body.gasLimit) : 3_000_000n
	const data = (body.data ?? '0x') as `0x${string}`
	const to = body.to ? createAddress(body.to) : undefined

	const tx = createImpersonatedTx(
		{
			chainId: BigInt(body.chainId),
			to,
			data: data === '0x' ? undefined : data,
			value,
			gasLimit,
			maxFeePerGas: 10n ** 9n,
			maxPriorityFeePerGas: 10n ** 8n,
			nonce: 0n,
			impersonatedAddress: fromAddress,
		},
		{ common: vm.common },
	)

	const runResult = await vm.runTx({
		tx,
		skipBalance: true,
		skipNonce: true,
	})

	const execResult = runResult.execResult
	const reverted = Boolean(execResult.exceptionError)
	const summaryStatus: TevmSimulationResult['summaryStatus'] = reverted
		? (execResult.exceptionError?.error?.message?.toLowerCase().includes('revert')
				? 'revert'
				: 'error')
		: 'success'

	let revertReason: string | undefined
	let errorSelector: string | undefined
	if (execResult.exceptionError && execResult.returnValue && execResult.returnValue.length >= 4) {
		errorSelector = toHex(execResult.returnValue.slice(0, 4))
		if (execResult.returnValue.length > 4) {
			revertReason = toHex(execResult.returnValue)
		}
	}
	if (!revertReason && execResult.exceptionError) {
		revertReason = execResult.exceptionError.error?.message ?? String(execResult.exceptionError)
	}

	const forkBlockNumber =
		typeof blockTag === 'number' ? blockTag : 0

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

	const rawLogs = (execResult.logs ?? []).map((log: { address: Uint8Array; topics: Uint8Array[]; data: Uint8Array }) => ({
		address: toHex(log.address),
		topics: log.topics.map((t: Uint8Array) => toHex(t)),
		data: bytesToHex(log.data),
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

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json()
		if (!body?.rpcUrl || typeof body.chainId !== 'number' || !body?.from) {
			return json(
				{ error: 'Missing or invalid body: rpcUrl, chainId, from required' },
				{ status: 400 },
			)
		}
		const result = await runTevmSimulation({
			rpcUrl: String(body.rpcUrl),
			chainId: Number(body.chainId),
			from: String(body.from),
			to: body.to != null ? String(body.to) : undefined,
			data: body.data != null ? String(body.data) : undefined,
			value: body.value != null ? String(body.value) : undefined,
			gasLimit: body.gasLimit != null ? String(body.gasLimit) : undefined,
			blockTag: body.blockTag,
		})
		return json(result)
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err)
		return json({ error: message }, { status: 500 })
	}
}
