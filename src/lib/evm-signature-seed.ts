/**
 * Seed EvmSelectors, EvmTopics, and EvmErrors with 10 popular items each if missing.
 */

import {
	evmErrorsCollection,
	normalizeEvmError4,
} from '$/collections/EvmErrors.ts'
import {
	evmSelectorsCollection,
	normalizeEvmSelector4,
} from '$/collections/EvmSelectors.ts'
import {
	evmTopicsCollection,
	normalizeEvmTopic32,
} from '$/collections/EvmTopics.ts'
import {
	popularEvmErrors,
	popularEvmSelectors,
	popularEvmTopics,
} from '$/constants/evm-signature-seed.ts'

export function seedEvmSignatureCollections() {
	for (const row of popularEvmSelectors) {
		const hex = normalizeEvmSelector4(row.$id.hex)
		if (!evmSelectorsCollection.state.get(hex)) {
			evmSelectorsCollection.insert({ $id: { hex }, signatures: row.signatures })
		}
	}
	for (const row of popularEvmTopics) {
		const hex = normalizeEvmTopic32(row.$id.hex)
		if (!evmTopicsCollection.state.get(hex)) {
			evmTopicsCollection.insert({ $id: { hex }, signatures: row.signatures })
		}
	}
	for (const row of popularEvmErrors) {
		const hex = normalizeEvmError4(row.$id.hex)
		if (!evmErrorsCollection.state.get(hex)) {
			evmErrorsCollection.insert({ $id: { hex }, signatures: row.signatures })
		}
	}
}
