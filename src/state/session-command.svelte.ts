/**
 * Pending session command from WebMCP (simulateSession / executeSession).
 * UI consumes and runs the command, then calls consumeSessionCommand() so the tool's promise resolves.
 */

export type SessionCommandKind = 'simulate' | 'execute'

export type SessionCommand = {
	sessionId: string
	command: SessionCommandKind
	resolve: () => void
}

let sessionCommand = $state<SessionCommand | null>(null)

export function getSessionCommand(): SessionCommand | null {
	return sessionCommand
}

export function setSessionCommand(
	sessionId: string,
	command: SessionCommandKind,
): Promise<void> {
	return new Promise((resolvePromise) => {
		sessionCommand = {
			sessionId,
			command,
			resolve: () => {
				sessionCommand = null
				resolvePromise()
			},
		}
	})
}

export function consumeSessionCommand(): void {
	const cmd = sessionCommand
	if (!cmd) return
	sessionCommand = null
	cmd.resolve()
}
