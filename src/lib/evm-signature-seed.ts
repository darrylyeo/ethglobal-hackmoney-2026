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
	for (const selector of popularEvmSelectors) {
		const hex = normalizeEvmSelector4(selector.$id.hex)
		if (!evmSelectorsCollection.state.get(hex)) {
			evmSelectorsCollection.insert({ $id: { hex }, signatures: selector.signatures })
		}
	}
	for (const topic of popularEvmTopics) {
		const hex = normalizeEvmTopic32(topic.$id.hex)
		if (!evmTopicsCollection.state.get(hex)) {
			evmTopicsCollection.insert({ $id: { hex }, signatures: topic.signatures })
		}
	}
	for (const error of popularEvmErrors) {
		const hex = normalizeEvmError4(error.$id.hex)
		if (!evmErrorsCollection.state.get(hex)) {
			evmErrorsCollection.insert({ $id: { hex }, signatures: error.signatures })
		}
	}
}
