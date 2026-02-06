/**
 * Limits for queries that can return large result sets, to avoid memory/UI overload.
 */

/** Max rows per collection used when building the graph scene (nodes/edges). */
export const GRAPH_SCENE_MAX_PER_COLLECTION = 500

/** Max transfer events combined across chains (eth_getLogs / Voltaire). */
export const TRANSFER_EVENTS_MAX_TOTAL = 5000

/** Max transfer items used from Covalent transfers_v2 response (already page-sized; cap total). */
export const COVALENT_TRANSFERS_MAX = 1000

/** Max token list entries kept after merging lists (per chain-address uniqueness). */
export const TOKEN_LIST_MAX_ENTRIES = 2000

