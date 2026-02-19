import { expect, test } from 'vitest'
import {
	FARCASTER_CLIENT_API_URL,
	FARCASTER_HUB_NODES,
	FARCASTER_NEYNAR_HUB_URL,
	FarcasterHubNode,
	farcasterHubNodeUrlById,
} from './farcaster.ts'

test('FARCASTER_CLIENT_API_URL and FARCASTER_NEYNAR_HUB_URL are defined', () => {
	expect(FARCASTER_CLIENT_API_URL).toBe('https://api.farcaster.xyz')
	expect(FARCASTER_NEYNAR_HUB_URL).toBe('https://snapchain-api.neynar.com')
})

test('FARCASTER_HUB_NODES has Pinata and StandardCrypto', () => {
	expect(FARCASTER_HUB_NODES).toHaveLength(2)
	expect(FARCASTER_HUB_NODES.map((e) => e.id)).toContain(
		FarcasterHubNode.Pinata,
	)
	expect(FARCASTER_HUB_NODES.map((e) => e.id)).toContain(
		FarcasterHubNode.StandardCrypto,
	)
})

test('farcasterHubNodeUrlById resolves URLs', () => {
	expect(farcasterHubNodeUrlById[FarcasterHubNode.Pinata]).toBe(
		'https://hub.pinata.cloud',
	)
	expect(farcasterHubNodeUrlById[FarcasterHubNode.StandardCrypto]).toContain(
		'hub.farcaster.standardcrypto.vc',
	)
})
